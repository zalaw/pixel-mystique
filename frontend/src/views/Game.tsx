import { useEffect, useState } from "react";
import { useGame } from "../hooks/useGame";
import { Stack, Loader, Button, Flex } from "@mantine/core";
import { useSocket } from "../hooks/useSocket";
import { useNavigate, useParams } from "react-router-dom";
import GameNotJoinable from "../components/GameNotJoinable";
import Clients from "../components/Clients";
import LobbySettings from "../components/LobbySettings";
import WrapperCard from "../components/WrapperCard";
import Round from "../components/Round";
import { IconArrowNarrowLeft } from "@tabler/icons-react";
import GameFinished from "../components/GameFinished";
import { RoomType } from "../types/RoomType";

const Game = () => {
  const { socket } = useSocket();
  const { setRoom, room, gameNotJoinableMessage } = useGame();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    if (!room.clients.find(client => client.id === socket.id)) {
      const name = localStorage.getItem("BABAJEE_NAME");

      setLoading(true);
      socket.connect();
      socket.emit("JOIN_ROOM", gameId, name);
    } else {
      setLoading(false);
    }

    socket.on("ROOM_DATA", (room: RoomType) => {
      setRoom(room);
      setLoading(false);
    });

    socket.on("ROOM_NOT_JOINABLE", () => {
      // setGameNotJoinableMessage(message);
      setLoading(false);
    });
  }, [socket]);

  const handleOnQuitClick = () => {
    socket?.disconnect();
    navigate("/");
  };

  if (loading) return <Loader />;

  return (
    <div>
      {gameNotJoinableMessage === "" ? (
        <Stack gap="2rem">
          <WrapperCard transparent p={0}>
            <Flex justify={"space-between"}>
              <Button leftSection={<IconArrowNarrowLeft />} variant="outline" w={"6rem"} onClick={handleOnQuitClick}>
                Quit
              </Button>
            </Flex>
          </WrapperCard>

          <WrapperCard>
            <Clients />
          </WrapperCard>

          {room.status === "lobby" && (
            <WrapperCard>
              <LobbySettings />
            </WrapperCard>
          )}

          {room.status === "in-game" && (
            <WrapperCard>
              <Round
                round={room.rounds[room.currentRoundIndex]}
                index={room.currentRoundIndex}
                seconds={room.settings.seconds}
                totalRounds={room.settings.rounds}
              />
            </WrapperCard>
          )}

          {room.status === "finished" && (
            <WrapperCard>
              <GameFinished />
            </WrapperCard>
          )}
        </Stack>
      ) : (
        <GameNotJoinable />
      )}
    </div>
  );
};

export default Game;
