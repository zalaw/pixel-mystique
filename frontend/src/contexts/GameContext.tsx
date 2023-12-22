import { ReactNode, createContext, useState } from "react";
import { RoomType } from "../types/RoomType";
import { ClientType } from "../types/ClientType";

interface IRoomContext {
  colors: ["#e03131", "#c2255c", "#9c36b5", "#6741d9", "#3b5bdb", "#1971c2", "#0c8599", "#099268"];
  room: RoomType;
  gameNotJoinableMessage: string;
  setGameNotJoinableMessage: React.Dispatch<React.SetStateAction<string>>;
  addClient: (client: ClientType) => void;
  removeClient: (clientId: string) => void;
  setRoom: React.Dispatch<React.SetStateAction<RoomType>>;
}

export const defaultState: IRoomContext = {
  colors: ["#e03131", "#c2255c", "#9c36b5", "#6741d9", "#3b5bdb", "#1971c2", "#0c8599", "#099268"],
  room: {
    code: "",
    clients: [],
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
  },
  gameNotJoinableMessage: "",
  setGameNotJoinableMessage: () => {},
  addClient: () => {},
  removeClient: () => {},
  setRoom: () => {},
};

export const GameContext = createContext<IRoomContext>(defaultState);

export function GameProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<RoomType>(defaultState.room);
  const [gameNotJoinableMessage, setGameNotJoinableMessage] = useState(defaultState.gameNotJoinableMessage);

  const addClient = (client: ClientType) => {
    setRoom(curr => ({ ...curr, clients: [...curr.clients, client] }));
  };

  const removeClient = (clientId: string) => {
    setRoom(curr => ({
      ...curr,
      clients: curr.clients.filter(client => client.id !== clientId),
    }));
  };

  const value = {
    colors: defaultState.colors,
    room,
    gameNotJoinableMessage,
    setGameNotJoinableMessage,
    addClient,
    removeClient,
    setRoom,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
