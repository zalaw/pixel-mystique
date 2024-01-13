import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import crypto from "crypto";
import { containsExplicitContent, delayWithError, generateRounds, updateImageDislikes } from "./utils/general-utils";
import { RoomSettingsType, RoomType, SettingsValue } from "./types/RoomType";
import { ClientType, ClientValue } from "./types/ClientType";
import { RoundType } from "./types/RoundType";
import path from "path";
import { getData } from "./utils/puppeteer-utils";
import { getList } from "./utils/openai-utils";
import { ScenarioType } from "./types/ScenarioType";
import mongoose from "mongoose";
import ScenarioModel from "./models/Scenario";
import { ScenarioItemType } from "./types/ScenarioItemType";

config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

const server = createServer(app);

const rooms = new Map<string, RoomType>();
const intervals = new Map<string, NodeJS.Timeout>();

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? "https://pixel-mystique.up.railway.app/" : "*",
    methods: ["GET"],
  },
});

io.on("connection", socket => {
  socket.on("CREATE_ROOM", async (name: string, callback) => {
    try {
      const scenarios = (await ScenarioModel.find({}, { name: 1 })) as ScenarioType[];

      const code = crypto.randomUUID();
      const room: RoomType = {
        code,
        scenarios,
        clients: [
          {
            id: socket.id,
            index: 0,
            name,
            isHost: true,
            isReady: false,
            isAnswerPicked: false,
          },
        ],

        status: "lobby",
        settings: {
          scenario: scenarios[0]._id || "",
          seconds: 10,
          rounds: 4,
          grayscale: true,
          pixelatedValue: 50,
        },
        currentRoundIndex: 0,
        rounds: [],
      };

      rooms.set(code, room);
      socket.join(code);

      callback({ code, scenarios });
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("JOIN_ROOM", ({ code, name }: { code: string; name: string }) => {
    const room = rooms.get(code);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");
    if (room.clients.length >= 8) return socket.emit("ROOM_NOT_JOINABLE", "Room is fool");
    if (room.status !== "lobby") return socket.emit("ROOM_NOT_JOINABLE", "Game already started");
    if (room.clients.find(client => client.id === socket.id)) return;

    const index = room.clients.length;

    room.clients = [
      ...room.clients,
      {
        id: socket.id,
        index,
        name,
        isHost: false,
        isReady: false,
        isAnswerPicked: false,
      },
    ];

    socket.to(code).emit("CLIENT_JOINED", { id: socket.id, index, name });

    socket.join(code);

    socket.emit("ROOM_DATA", { room });

    if (!name) socket.emit("NAME_NOT_SET");
  });

  socket.on("GAME_SETTINGS_CHANGED", (key: keyof RoomSettingsType, value: SettingsValue) => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");
    if (!(key in room.settings)) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");
    if (!room.clients.find(client => client.id === socket.id)?.isHost)
      return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    (room.settings[key] as SettingsValue) = value;

    socket.to(roomCode).emit("GAME_SETTINGS_CHANGED", key, value);
  });

  socket.on("CLIENT_DATA_CHANGED", (key: keyof ClientType, value: ClientValue) => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    const client = room.clients.find(client => client.id === socket.id);

    if (!client) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    (client[key] as ClientValue) = value;

    io.to(roomCode).emit("CLIENT_DATA_CHANGED", [[socket.id, key, value]]);
  });

  socket.on("GAME_START", async () => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    room.clients.forEach(client => (client.isReady = false));
    room.status = "in-game";

    io.to(roomCode).emit("GAME_STARTING");

    try {
      const scenario = await ScenarioModel.findById(room.settings.scenario).exec();

      if (!scenario) return await delayWithError(1);

      room.rounds = await generateRounds(
        room.settings.pixelatedValue,
        room.settings.grayscale,
        scenario.items as ScenarioItemType[],
        room.settings.rounds
      );

      room.clients.forEach(client => (client.isReady = false));
      room.status = "in-game";
    } catch (err) {
      console.log(err);

      room.clients.forEach(client => (client.isReady = false));
      room.status = "lobby";

      io.to(roomCode).emit("ERROR_WHILE_STARTING");

      return;
    }

    const roundWithoutCorrectAnswerId: RoundType = {
      ...room.rounds[room.currentRoundIndex],
      correctAnswerId: "",
      originalImage: new ArrayBuffer(0),
    };

    io.to(roomCode).emit("GAME_START", { round: roundWithoutCorrectAnswerId });

    const interval = setInterval(() => {
      if (room.currentRoundIndex >= room.settings.rounds - 1) {
        clearInterval(interval);

        io.to(roomCode).emit(
          "GAME_FINISHED",
          room.rounds.map(round => ({
            answers: round.answers.map(answer => answer.pickedBy),
            correctAnswerId: round.correctAnswerId,
            originalImage: round.originalImage,
          }))
        );

        room.clients = room.clients.map(client => ({
          ...client,
          isAnswerPicked: false,
        }));
        room.status = "finished";
      } else {
        room.currentRoundIndex = room.currentRoundIndex + 1;

        const roundWithoutCorrectAnswerId: RoundType = {
          ...room.rounds[room.currentRoundIndex],
          correctAnswerId: "",
        };

        io.to(roomCode).emit("NEXT_ROUND", { round: roundWithoutCorrectAnswerId });
      }
    }, (room.settings.seconds + 1) * 1000);

    intervals.set(roomCode, interval);
  });

  socket.on("ANSWER", (answerId: string) => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    const client = room.clients.find(client => client.id === socket.id);

    if (!client) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    const newAnswer = room.rounds[room.currentRoundIndex].answers.find(answer => answer.id === answerId);

    if (!newAnswer) return;

    const currentRoundAnswers = room.rounds[room.currentRoundIndex].answers;
    const previousPickedAnswer = currentRoundAnswers.find(answer =>
      answer.pickedBy.some(client => client.id === socket.id)
    );

    if (previousPickedAnswer) {
      previousPickedAnswer.pickedBy = previousPickedAnswer.pickedBy.filter(client => client.id !== socket.id);
    }

    newAnswer.pickedBy = [...newAnswer.pickedBy, { id: socket.id, index: client.index, name: client.name }];
  });

  socket.on("PLAY_AGAIN", () => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    room.status = "lobby";
    room.currentRoundIndex = 0;
    room.rounds = [];

    socket.to(roomCode).emit("PLAY_AGAIN");
  });

  socket.on("PROMOTE_TO_HOST", (id: string) => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");
    if (!room.clients.find(client => client.id === socket.id)?.isHost) return;

    const currentHost = room.clients.find(client => client.id === socket.id);
    const newHost = room.clients.find(client => client.id === id);

    if (!currentHost || !newHost) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    currentHost.isHost = false;
    currentHost.isReady = false;
    newHost.isHost = true;
    newHost.isReady = false;

    socket.to(roomCode).emit("CLIENT_DATA_CHANGED", [
      [currentHost.id, "isHost", false, "isReady", false],
      [newHost.id, "isHost", true, "isReady", false],
    ]);
  });

  socket.on("KICK_CLIENT", (id: string) => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");
    if (!room.clients.find(client => client.id === socket.id)?.isHost)
      return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

    room.clients = room.clients.filter(client => client.id !== id);

    io.to(id).emit("ROOM_NOT_JOINABLE", "You got kicked");
    io.to(roomCode).emit("CLIENT_DISCONNECTED", { clientId: id });

    const s = io.sockets.sockets.get(id);

    s?.leave(roomCode);
  });

  socket.on("disconnecting", () => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return;

    const isHost = room.clients.find(client => client.id === socket.id);

    room.clients = room.clients.filter(client => client.id !== socket.id);

    if (room.clients.length === 0) {
      rooms.delete(roomCode);
      const interval = intervals.get(roomCode);
      if (interval) clearInterval(interval);
      intervals.delete(roomCode);
      return;
    }

    io.to(roomCode).emit("CLIENT_DISCONNECTED", { clientId: socket.id });

    if (isHost) {
      room.clients[0].isHost = true;
      room.clients[0].isReady = false;

      socket.to(roomCode).emit("CLIENT_DATA_CHANGED", [[room.clients[0].id, "isHost", true, "isReady", false]]);
    }
  });

  socket.on("GENERATE_LIST", async ({ prompt }: { prompt: string }, callback) => {
    if (containsExplicitContent(prompt)) return callback("Explicit content is not allowed");

    const list = await getList(prompt, 25);

    callback(list.map(item => ({ id: crypto.randomUUID(), name: item })));
  });

  socket.on(
    "CREATE_SCENARIO",
    async ({ scenarioName, list, extra }: { scenarioName: string; list: string[]; extra: string }, callback) => {
      try {
        const [_, roomCode] = Array.from(socket.rooms.values());

        const room = rooms.get(roomCode);

        if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

        const data = await getData(list, extra);

        const scenarioToAdd = new ScenarioModel({
          name: scenarioName,
          items: data.map(item => ({
            name: item.name,
            images: item.imageURLS.map(imageURL => ({ url: imageURL, dislikes: 0 })),
          })),
        });

        const newScenario = await scenarioToAdd.save();

        room.scenarios.unshift({ _id: newScenario._id.toString(), name: scenarioName });
        room.settings.scenario = newScenario._id.toString();

        callback({ isError: false });

        io.to(roomCode).emit("SCENARIO", { scenario: newScenario });
      } catch (err) {
        console.log(err);
        callback({ isError: true });
      }
    }
  );

  socket.on("DISLIKE_IMAGE", async (id: string, callback) => {
    try {
      const [_, roomCode] = Array.from(socket.rooms.values());

      const room = rooms.get(roomCode);

      if (!room) return socket.emit("ROOM_NOT_JOINABLE", "Room does not exist");

      await updateImageDislikes(room.settings.scenario, id);

      callback({ isError: false });
    } catch (err) {
      callback({ isError: true });
    }
  });

  socket.on("TEST", () => {
    console.log(rooms);
    console.log(intervals);
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../public", "dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../public", "dist", "index.html"));
  });
}

mongoose
  .connect(
    `${process.env.DATABASE_URL}${
      process.env.NODE_ENV === "production" ? "prod" : "dev"
    }?retryWrites=true&w=majority` || "mongodb://127.0.0.1:27017"
  )
  .then(() => {
    server.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);

      rooms.clear();
      intervals.clear();
    });
  })
  .catch(err => {
    console.log("Could not connect");
    console.log(err);
  });
