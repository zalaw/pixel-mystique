import { useEffect } from "react";
import { Flex, Select, Text, Slider, Chip, Button, Title, Stack, AspectRatio, NumberInput } from "@mantine/core";
import { signal } from "@preact/signals-react";

import { socket } from "../socket";
import { room } from "../App";
import { ImagePixelated } from "./ImagePixelated";
import { RoomSettingsType, SettingsValue } from "../types/RoomType";
import { ClientType, ClientValue } from "../types/ClientType";
import Jojo from "../assets/jojo.jpg";

interface LobbySettingsProps {
  currentClient: ClientType;
}

const isError = signal<boolean>(false);
const loading = signal<boolean>(false);

const LobbySettings = ({ currentClient }: LobbySettingsProps) => {
  const areAllClientsReady = room.value.clients.filter(client => !client.isHost).every(client => client.isReady);
  const scenarios = [
    { value: "jojoCharacters", label: "JoJo's Bizarre Adventure characters" },
    { value: "jojoStands", label: "JoJo's Bizarre Adventure stands" },
  ];

  useEffect(() => {
    socket.on("ERROR_WHILE_STARTING", () => {
      isError.value = true;
      loading.value = false;
    });

    socket.on("GAME_STARTING", () => {
      loading.value = true;
    });

    return () => {
      loading.value = false;
    };
  }, []);

  const handleGameSettingsChanged = (key: keyof RoomSettingsType, value: SettingsValue) => {
    if (!currentClient?.isHost) return;

    room.value = {
      ...room.value,
      settings: {
        ...room.value.settings,
        [key]: value,
      },
    };

    socket.emit("GAME_SETTINGS_CHANGED", key, value);
  };

  const handleClientDataChanged = (key: keyof ClientType, value: ClientValue) => {
    room.value = {
      ...room.value,
      clients: room.value.clients.map(client =>
        client.id === currentClient?.id ? { ...client, [key]: value } : client
      ),
    };

    socket.emit("CLIENT_DATA_CHANGED", key, value);
  };

  const handleStartOnClick = () => {
    socket.emit("GAME_START");
  };

  return (
    <>
      <Stack gap={"3rem"}>
        <Title>Lobby settings</Title>

        <Select
          readOnly={!currentClient?.isHost}
          label="Scenario"
          allowDeselect={false}
          data={scenarios}
          value={room.value.settings.scenario}
          onChange={value => handleGameSettingsChanged("scenario", value)}
          comboboxProps={{ shadow: "lg" }}
        />

        <AspectRatio ratio={16 / 9}>
          <ImagePixelated
            gray={room.value.settings.grayscale}
            src={Jojo}
            pixelSize={room.value.settings.pixelatedValue}
            centered={true}
          />
        </AspectRatio>

        <Flex gap={"2rem"}>
          <NumberInput
            readOnly={!currentClient?.isHost}
            value={room.value.settings.seconds}
            onChange={value => handleGameSettingsChanged("seconds", value || 10)}
            w={"100%"}
            min={2}
            max={60}
            label={"Seconds"}
          />
          <NumberInput
            readOnly={!currentClient?.isHost}
            value={room.value.settings.rounds}
            onChange={value => handleGameSettingsChanged("rounds", value || 4)}
            w={"100%"}
            min={1}
            max={10}
            label={"Rounds"}
          />
        </Flex>

        {currentClient?.isHost ? (
          <Flex align={"center"} gap={"2rem"}>
            <Chip
              disabled={!currentClient?.isHost}
              checked={room.value.settings.grayscale}
              onChange={value => handleGameSettingsChanged("grayscale", value)}
            >
              Gray
            </Chip>

            <Flex direction={"column"} w={"100%"}>
              <Text>Pixelated value</Text>
              <Slider
                aria-readonly={true}
                defaultValue={room.value.settings.pixelatedValue}
                disabled={!currentClient?.isHost}
                className={!currentClient?.isHost ? "disabled" : ""}
                w={"100%"}
                marks={[
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 30, label: "30" },
                  { value: 40, label: "40" },
                  { value: 50, label: "50" },
                ]}
                onChangeEnd={value => handleGameSettingsChanged("pixelatedValue", value)}
                min={10}
                max={50}
              />
            </Flex>
          </Flex>
        ) : null}

        <Stack>
          {isError.value && (
            <Text size="sm" c={"red"}>
              Error while starting the game
            </Text>
          )}
          <Flex>
            {currentClient?.isHost ? (
              <Button
                style={{ flexGrow: 1 }}
                disabled={!areAllClientsReady}
                loading={loading.value}
                onClick={handleStartOnClick}
              >
                {areAllClientsReady ? "Start" : "All clients must be ready"}
              </Button>
            ) : (
              <Button
                color="teal"
                variant={currentClient?.isReady ? "filled" : "default"}
                style={{ flexGrow: 1 }}
                loading={loading.value}
                onClick={() => handleClientDataChanged("isReady", !currentClient?.isReady)}
              >
                {currentClient?.isReady ? "I'm ready" : "I'm not ready"}
              </Button>
            )}
          </Flex>
        </Stack>
      </Stack>
    </>
  );
};

export default LobbySettings;
