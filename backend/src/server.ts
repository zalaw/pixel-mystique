import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import { Server } from "socket.io";
import crypto from "crypto";
import { jojoCharacters, jojoStands } from "./data";
import { delayWithError, generateRounds } from "./utils/general-utils";
import { RoomSettingsType, RoomType, SettingsValue } from "./types/RoomType";
import { ClientType, ClientValue } from "./types/ClientType";
import { RoundType } from "./types/RoundType";
import Jimp from "jimp";

config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const server = createServer(app);

const rooms = new Map<string, RoomType>();
const intervals = new Map<string, NodeJS.Timeout>();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET"],
  },
});

io.on("connection", socket => {
  socket.on("CREATE_ROOM", (name: string) => {
    const code = crypto.randomUUID();
    const room: RoomType = {
      code,
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
        scenario: "jojoCharacters",
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

    socket.emit("ROOM_CREATED", { code, name });
  });

  socket.on("JOIN_ROOM", (gameId: string, name: string) => {
    const room = rooms.get(gameId);

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

    socket.to(gameId).emit("CLIENT_JOINED", { id: socket.id, index, name });

    socket.join(gameId);

    socket.emit("ROOM_DATA", room);

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
      // await delayWithError(10000);

      room.rounds = await generateRounds(
        room.settings.pixelatedValue,
        room.settings.grayscale,
        room.settings.scenario === "jojoCharacters" ? jojoCharacters : jojoStands,
        room.settings.rounds
      );
    } catch (err) {
      console.log(err);
      room.status = "lobby";
      io.to(roomCode).emit("ERROR_");

      return;
    }

    const roundWithoutCorrectAnswerId: RoundType = {
      ...room.rounds[room.currentRoundIndex],
      correctAnswerId: "",
      originalImage: new ArrayBuffer(0),
    };

    io.to(roomCode).emit("GAME_START", roundWithoutCorrectAnswerId);

    const interval = setInterval(() => {
      console.log("interval run");

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

        io.to(roomCode).emit("NEXT_ROUND", roundWithoutCorrectAnswerId);
      }
    }, room.settings.seconds * 1000);

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
    io.to(roomCode).emit("CLIENT_DISCONNECTED", id);

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
      clearInterval(interval);
      intervals.delete(roomCode);
      return;
    }

    io.to(roomCode).emit("CLIENT_DISCONNECTED", socket.id);

    if (isHost) {
      room.clients[0].isHost = true;
      room.clients[0].isReady = false;

      socket.to(roomCode).emit("CLIENT_DATA_CHANGED", [[room.clients[0].id, "isHost", true, "isReady", false]]);
    }
  });

  socket.on("GET_ROOM", () => {
    const [_, roomCode] = Array.from(socket.rooms.values());

    const room = rooms.get(roomCode);

    if (!room) return;

    socket.emit("GET_ROOM", room);
  });

  socket.on("WEATHER_REPORT", async () => {
    const rounds = await generateRounds(20, false, jojoCharacters, 10);

    socket.emit(
      "WEATHER_REPORT",
      rounds.map(round => round.image)
    );
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  rooms.clear();
  intervals.clear();
});
