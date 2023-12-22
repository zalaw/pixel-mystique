import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { SocketProvider } from "./contexts/SocketContext.tsx";
import { GameProvider } from "./contexts/GameContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MantineProvider defaultColorScheme="dark">
        <GameProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </GameProvider>
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);
