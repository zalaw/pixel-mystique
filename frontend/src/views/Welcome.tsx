import { useNavigate } from "react-router-dom";
import { Stack, TextInput, Button, Text } from "@mantine/core";
import { computed, signal } from "@preact/signals-react";

import WrapperCard from "../components/WrapperCard";
import { RECONNECTION_ATTEMPTS, socket } from "../socket";
import { loading, name, room, roomDefaultState } from "../App";
import { useEffect } from "react";
import { ScenarioType } from "../types/ScenarioType";

type CreateRoomResponse = {
  scenarios: ScenarioType[];
  code: string;
};

const retries = signal<number>(0);
const isSocketError = signal<boolean>(false);
const disabled = computed<boolean>(() => name.value.trim() === "");

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    room.value = roomDefaultState;
  }, []);

  const handleCreateGame = (e?: React.FormEvent<HTMLFormElement | HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (loading.value || disabled.value) return;

    isSocketError.value = false;
    loading.value = true;

    socket.connect();

    socket.emit("CREATE_ROOM", name.value, (response: CreateRoomResponse) => {
      room.value = {
        ...room.value,
        scenarios: response.scenarios,
        code: response.code,
        settings: {
          ...room.value.settings,
          scenario: response.scenarios[0].id || "",
        },
        clients: [
          {
            id: socket.id,
            index: 0,
            name: name.value,
            isHost: true,
            isReady: false,
            isAnswerPicked: false,
          },
        ],
      };

      navigate(`/game/${response.code}`);

      loading.value = false;
    });

    socket.on("connect_error", () => {
      retries.value++;

      if (retries.value > RECONNECTION_ATTEMPTS) {
        retries.value = 0;
        loading.value = false;
        isSocketError.value = true;

        socket.removeListener("connect_error");
      }
    });
  };

  const handleUpdateName = (value: string) => {
    name.value = value;
    localStorage.setItem("BABAJEE_NAME", name.value);
  };

  return (
    <WrapperCard>
      <form onSubmit={handleCreateGame} autoComplete={"off"}>
        <Stack>
          <TextInput
            defaultValue={name.value}
            label="Name"
            onInput={e => handleUpdateName((e.target as HTMLInputElement).value)}
          />

          <Button disabled={disabled.value || loading.value} loading={loading.value} onClick={handleCreateGame}>
            Create game
          </Button>

          {isSocketError.value ? (
            <Text fz={"14px"} fw={500} c={"red"}>
              Unable to connect to the server
            </Text>
          ) : null}
        </Stack>
      </form>
    </WrapperCard>
  );
};

export default Welcome;
