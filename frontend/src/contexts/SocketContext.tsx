import { ReactNode, createContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useGame } from "../hooks/useGame";
import { RoomSettingsType } from "../types/RoomType";
import { RoundType } from "../types/RoundType";
import { ClientType } from "../types/ClientType";

type ClientValue = boolean | string;

interface ISocketContext {
  socket: Socket | null;
}

const defaultState: ISocketContext = {
  socket: null,
};

export const SocketContext = createContext<ISocketContext>(defaultState);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { setGameNotJoinableMessage, addClient, removeClient, setRoom } = useGame();

  const [socket, setSocket] = useState<Socket | null>(defaultState.socket);

  useEffect(() => {
    const s = io("https://pixel-mystique.up.railway.app/" || "http://localhost:3001", {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: false,
    });

    setSocket(s);

    s.on("ROOM_NOT_JOINABLE", (message: string) => {
      setGameNotJoinableMessage(message);
      s.disconnect();
    });

    s.on("CLIENT_JOINED", ({ id, index, name }: { id: string; index: number; name: string }) => {
      addClient({
        id,
        index,
        name,
        isHost: false,
        isReady: false,
        isAnswerPicked: false,
      });
    });

    s.on("GAME_SETTINGS_CHANGED", (key: keyof RoomSettingsType, value) => {
      setRoom(curr => ({
        ...curr,
        settings: { ...curr.settings, [key]: value },
      }));
    });

    s.on("CLIENT_DATA_CHANGED", (data: [string, never][]) => {
      data.forEach(entry => {
        setRoom(curr => {
          const copy = { ...curr };
          const client = copy.clients.find(client => client.id === entry[0])!;

          for (let i = 1; i < entry.length; i += 2) {
            (client[entry[i] as keyof ClientType] as ClientValue) = entry[i + 1];
          }

          return copy;
        });
      });
    });

    s.on("GAME_START", (round: RoundType) => {
      setRoom(curr => ({
        ...curr,
        clients: curr.clients.map(client => ({ ...client, isReady: false })),
        status: "in-game",
        rounds: [round],
      }));
    });

    s.on("ANSWER_PICKED", ({ clientId }) => {
      setRoom(curr => ({
        ...curr,
        clients: curr.clients.map(client => (client.id === clientId ? { ...client, isAnswerPicked: true } : client)),
      }));
    });

    s?.on("NEXT_ROUND", (round: RoundType) => {
      setRoom(curr => ({
        ...curr,
        clients: curr.clients.map(client => ({
          ...client,
          isAnswerPicked: false,
        })),
        currentRoundIndex: curr.currentRoundIndex + 1,
        rounds: [...curr.rounds, round],
      }));
    });

    s.on("GAME_FINISHED", data => {
      setRoom(curr => ({
        ...curr,
        clients: curr.clients.map(client => ({
          ...client,
          isAnswerPicked: false,
        })),
        rounds: curr.rounds.map((round, index) => ({
          ...round,
          answers: round.answers.map((answer, index2) => ({
            ...answer,
            pickedBy: data[index].answers[index2],
          })),
          correctAnswerId: data[index].correctAnswerId,
          originalImage: data[index].originalImage,
        })),
        status: "finished",
      }));
    });

    s.on("PLAY_AGAIN", () => {
      setRoom(curr => ({
        ...curr,
        status: "lobby",
        rounds: [],
        currentRoundIndex: 0,
      }));
    });

    s.on("CLIENT_DISCONNECTED", (clientId: string) => {
      removeClient(clientId);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const value = {
    socket,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
