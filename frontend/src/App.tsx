import "@mantine/core/styles.css";

import { signal } from "@preact/signals-react";
import { Routes, Route } from "react-router-dom";

import Main from "./layouts/Main";
import Welcome from "./views/Welcome";
import Game from "./views/Game";
import NotFound from "./views/NotFound";

import { RoomType } from "./types/RoomType";

export const roomDefaultState: RoomType = {
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
};

export const colors = signal<string[]>([
  "#e03131",
  "#c2255c",
  "#9c36b5",
  "#6741d9",
  "#3b5bdb",
  "#1971c2",
  "#0c8599",
  "#099268",
]);
export const loading = signal<boolean>(false);
export const gameNotJoinableMessage = signal<string>("");
export const name = signal<string>(localStorage.getItem("BABAJEE_NAME") || "");
export const room = signal<RoomType>(roomDefaultState);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />}>
        <Route index element={<Welcome />} />
        <Route path={`/game/:code`} element={<Game />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
