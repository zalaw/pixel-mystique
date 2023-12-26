import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Stack, Loader, Button, Flex, Modal, Text } from "@mantine/core";
import { IconArrowNarrowLeft } from "@tabler/icons-react";
import { signal } from "@preact/signals-react";

import { gameNotJoinableMessage, loading, room, name } from "../App";
import { RECONNECTION_ATTEMPTS, socket } from "../socket";
import WrapperCard from "../components/WrapperCard";
import Clients from "../components/Clients";
import GameNotJoinable from "../components/GameNotJoinable";
import UpdateName from "../components/UpdateName";
import LobbySettings from "../components/LobbySettings";
import Round from "../components/Round";
import GameFinished from "../components/GameFinished";
// import GameFinished from "../components/GameFinished";
// import GameNotJoinable from "../components/GameNotJoinable";

const retries = signal<number>(0);
const isSocketError = signal<boolean>(false);

const Game = () => {
  const navigate = useNavigate();
  const { code } = useParams();

  useEffect(() => {
    if (loading.value) return;

    gameNotJoinableMessage.value = "";

    if (room.value.code === "") {
      loading.value = true;

      socket.connect();
      socket.emit("JOIN_ROOM", { code, name: localStorage.getItem("BABAJEE_NAME") });
    }

    socket.on("connect_error", () => {
      retries.value++;

      if (retries.value > RECONNECTION_ATTEMPTS) {
        retries.value = 0;
        loading.value = false;
        isSocketError.value = true;

        socket.removeListener("connect_error");
      }
    });
  }, [code]);

  const handleOnQuitClick = () => {
    socket.disconnect();
    navigate("/");
  };

  if (loading.value)
    return (
      <Flex justify={"center"}>
        <Loader />
      </Flex>
    );

  if (isSocketError.value)
    return (
      <WrapperCard>
        <Flex direction={"column"} gap={"1rem"}>
          <Text fz={"14px"} fw={500} c={"red"}>
            Unable to connect to the server
          </Text>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </Flex>
      </WrapperCard>
    );

  if (gameNotJoinableMessage.value !== "") return <GameNotJoinable message={gameNotJoinableMessage.value} />;

  return (
    <div>
      <Modal
        size={"36rem"}
        opened={name.value.trim() === ""}
        onClose={() => {}}
        closeOnClickOutside={false}
        withCloseButton={false}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 8,
        }}
      >
        <WrapperCard transparent>
          <UpdateName />
        </WrapperCard>
      </Modal>

      <Stack gap="2rem">
        <WrapperCard transparent p={0}>
          <Flex justify={"space-between"}>
            <Button leftSection={<IconArrowNarrowLeft />} variant="outline" w={"6rem"} onClick={handleOnQuitClick}>
              Quit
            </Button>
          </Flex>
        </WrapperCard>

        <WrapperCard>
          <Clients clients={[...room.value.clients]} />
        </WrapperCard>

        {room.value.status === "lobby" && (
          <WrapperCard>
            <LobbySettings currentClient={room.value.clients.find(client => client.id === socket.id)!} />
          </WrapperCard>
        )}

        {room.value.status === "in-game" && (
          <WrapperCard>
            <Round
              round={room.value.rounds[room.value.currentRoundIndex]}
              currentIndex={room.value.currentRoundIndex}
              totalRounds={room.value.settings.rounds}
              roomStatus={room.value.status}
              duration={room.value.settings.seconds}
            />
          </WrapperCard>
        )}

        {room.value.status === "finished" && (
          <WrapperCard>
            {/* <Stack gap={"4rem"}>
              {room.value.rounds.map((round, index) => (
                <Round key={round.id} round={round} currentIndex={index} roomStatus={room.value.status} />
              ))}
            </Stack> */}
            <GameFinished clients={room.value.clients} rounds={room.value.rounds} />
          </WrapperCard>
        )}
      </Stack>
    </div>
  );
};

export default Game;
