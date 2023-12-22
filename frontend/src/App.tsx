import "@mantine/core/styles.css";
import { Routes, Route } from "react-router-dom";
import Welcome from "./views/Welcome";
import Game from "./views/Game";
import NotFound from "./views/NotFound";

function App() {
  return (
    <Routes>
      <Route index element={<Welcome />} />
      <Route path={`/game/:gameId`} element={<Game />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
