import { useState, useEffect } from "react";
import { Flex, Select, Text, Slider, Chip, Button, Title, Stack, Modal, AspectRatio, NumberInput } from "@mantine/core";
import { useGame } from "../hooks/useGame";
import { useSocket } from "../hooks/useSocket";
import { ImagePixelated } from "./ImagePixelated";
import Jojo from "../assets/jojo.jpg";
import { RoomSettingsType, SettingsValue } from "../types/RoomType";
import { ClientType, ClientValue } from "../types/ClientType";
import UpdateName from "./UpdateName";

const LobbySettings = () => {
  const { socket } = useSocket();
  const { room, setRoom } = useGame();

  const client = room.clients.find(client => client.id === socket!.id);
  const areAllClientsReady = room.clients.filter(client => !client.isHost).every(client => client.isReady);

  const scenarios = [
    { value: "jojoCharacters", label: "JoJo's Bizarre Adventure characters" },
    { value: "jojoStands", label: "JoJo's Bizarre Adventure stands" },
  ];

  const [showUpdateNameModal, setShowUpdateNameModal] = useState(false);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<RoomSettingsType>({
    ...room.settings,
  });

  useEffect(() => {
    Object.entries(room.settings).forEach(entry => setSettings(curr => ({ ...curr, [entry[0]]: entry[1] })));
  }, [room.settings]);

  useEffect(() => {
    socket?.on("NAME_NOT_SET", () => {
      setShowUpdateNameModal(true);
    });

    socket?.on("GAME_STARTING", () => {
      setLoading(true);
      setIsError(false);
    });

    socket?.on("ERROR_", () => {
      setLoading(false);
      setIsError(true);
    });

    return () => {
      setLoading(false);
      setIsError(false);
    };
  }, []);

  const handleGameSettingsChanged = (key: keyof RoomSettingsType, value: SettingsValue) => {
    if (!client?.isHost) return;

    setRoom(curr => ({
      ...curr,
      settings: { ...curr.settings, [key]: value },
    }));

    socket?.emit("GAME_SETTINGS_CHANGED", key, value);
  };

  const handleClientDataChanged = (key: keyof ClientType, value: ClientValue) => {
    setRoom(curr => ({
      ...curr,
      clients: curr.clients.map(client => (client.id === socket!.id ? { ...client, [key]: value } : client)),
    }));
    socket?.emit("CLIENT_DATA_CHANGED", key, value);
  };

  const handleStartOnClick = () => {
    socket?.emit("GAME_START");
  };

  return (
    <>
      <Modal opened={showUpdateNameModal} onClose={() => {}} closeOnClickOutside={false} withCloseButton={false}>
        <UpdateName callback={() => setShowUpdateNameModal(false)} />
      </Modal>

      <Stack gap={"3rem"}>
        <Title>Lobby settings</Title>

        {client?.isHost ? (
          <Select
            label="Scenario"
            disabled={!client.isHost}
            allowDeselect={false}
            data={scenarios}
            value={settings.scenario}
            onChange={value => handleGameSettingsChanged("scenario", value)}
          />
        ) : (
          <Flex gap={"1rem"}>
            <Text fw={"bold"}>Scenario:</Text>
            <Text>{scenarios.find(scenario => scenario.value === room.settings.scenario)?.label}</Text>
          </Flex>
        )}

        <AspectRatio ratio={16 / 9}>
          <ImagePixelated gray={settings.grayscale} src={Jojo} pixelSize={settings.pixelatedValue} centered={true} />
        </AspectRatio>

        <Flex gap={"2rem"}>
          <NumberInput
            value={settings.seconds}
            onChange={value => handleGameSettingsChanged("seconds", value || 10)}
            w={"100%"}
            min={2}
            max={60}
            label={"Seconds"}
          />
          <NumberInput
            value={settings.rounds}
            onChange={value => handleGameSettingsChanged("rounds", value || 4)}
            w={"100%"}
            min={1}
            max={10}
            label={"Rounds"}
          />
        </Flex>

        {client?.isHost ? (
          <Flex align={"center"} gap={"2rem"}>
            <Chip
              disabled={!client.isHost}
              checked={settings.grayscale}
              onChange={value => handleGameSettingsChanged("grayscale", value)}
            >
              Gray
            </Chip>

            <Flex direction={"column"} w={"100%"}>
              <Text>Pixelated value</Text>
              <Slider
                defaultValue={settings.pixelatedValue}
                disabled={!client.isHost}
                className={!client.isHost ? "disabled" : ""}
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
          {isError && (
            <Text size="sm" c={"red"}>
              Error while starting the game
            </Text>
          )}
          <Flex>
            {client?.isHost ? (
              <Button
                style={{ flexGrow: 1 }}
                disabled={!areAllClientsReady}
                loading={loading}
                onClick={handleStartOnClick}
              >
                {areAllClientsReady ? "Start" : "All clients must be ready"}
              </Button>
            ) : (
              <Button
                color="teal"
                variant={client?.isReady ? "filled" : "default"}
                style={{ flexGrow: 1 }}
                loading={loading}
                onClick={() => handleClientDataChanged("isReady", !client?.isReady)}
              >
                {client?.isReady ? "I'm ready" : "I'm not ready"}
              </Button>
            )}
          </Flex>
        </Stack>
      </Stack>
    </>
  );
};

export default LobbySettings;
