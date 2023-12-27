import { io } from "socket.io-client";
import { gameNotJoinableMessage, room } from "./App";
import { loading } from "./App";
import { RoomSettingsType, RoomType } from "./types/RoomType";
import { ClientType } from "./types/ClientType";
import { RoundType } from "./types/RoundType";

type ClientValue = boolean | string;

const RECONNECTION_DELAY = 500;
const RECONNECTION_DELAY_MAX = 1500;
export const RECONNECTION_ATTEMPTS = 3;

export const socket = io(
  process.env.NODE_ENV === "production" ? process.env.RAILWAY_PUBLIC_DOMAIN || "" : "http://localhost:3001",
  {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: RECONNECTION_DELAY,
    reconnectionDelayMax: RECONNECTION_DELAY_MAX,
    reconnectionAttempts: RECONNECTION_ATTEMPTS,
  }
);

socket.on("ROOM_NOT_JOINABLE", message => {
  socket.disconnect();
  gameNotJoinableMessage.value = message;
  loading.value = false;
});

socket.on("CLIENT_JOINED", ({ id, index, name }: { id: string; index: number; name: string }) => {
  room.value = {
    ...room.value,
    clients: [
      ...room.value.clients,
      {
        id,
        index,
        name,
        isHost: false,
        isReady: false,
        isAnswerPicked: false,
      },
    ],
  };
});

socket.on("ROOM_DATA", ({ room: receivedRoom }: { room: RoomType }) => {
  room.value = receivedRoom;
  loading.value = false;
});

socket.on("GAME_SETTINGS_CHANGED", (key: keyof RoomSettingsType, value) => {
  room.value = {
    ...room.value,
    settings: {
      ...room.value.settings,
      [key]: value,
    },
  };
});

socket.on("CLIENT_DATA_CHANGED", (data: [string, never][]) => {
  data.forEach(entry => {
    const copy = { ...room.value };
    const client = copy.clients.find(client => client.id === entry[0])!;

    for (let i = 1; i < entry.length; i += 2) {
      (client[entry[i] as keyof ClientType] as ClientValue) = entry[i + 1];
    }

    room.value = copy;
  });
});

socket.on("GAME_START", ({ round }: { round: RoundType }) => {
  room.value = {
    ...room.value,
    clients: room.value.clients.map(client => ({ ...client, isReady: false })),
    status: "in-game",
    rounds: [round],
  };
});

socket.on("NEXT_ROUND", ({ round }: { round: RoundType }) => {
  room.value = {
    ...room.value,
    clients: room.value.clients.map(client => ({ ...client, isAnswerPicked: false })),
    currentRoundIndex: room.value.currentRoundIndex + 1,
    rounds: [...room.value.rounds, round],
  };
});

socket.on("GAME_FINISHED", data => {
  room.value = {
    ...room.value,
    status: "finished",
    clients: room.value.clients.map(client => ({ ...client, isAnswerPicked: false })),
    rounds: room.value.rounds.map((round, index) => ({
      ...round,
      answers: round.answers.map((answer, index2) => ({
        ...answer,
        pickedBy: data[index].answers[index2],
      })),
      correctAnswerId: data[index].correctAnswerId,
      originalImage: data[index].originalImage,
    })),
  };
});

socket.on("PLAY_AGAIN", () => {
  room.value = {
    ...room.value,
    status: "lobby",
    rounds: [],
    currentRoundIndex: 0,
  };
});

socket.on("CLIENT_DISCONNECTED", ({ clientId }: { clientId: string }) => {
  room.value = { ...room.value, clients: room.value.clients.filter(client => client.id !== clientId) };
});
