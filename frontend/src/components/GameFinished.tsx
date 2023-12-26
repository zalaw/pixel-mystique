import { Stack, Button } from "@mantine/core";
import WrapperCard from "./WrapperCard";
import Round from "./Round";
import { ClientType, ClientValue } from "../types/ClientType";
import { RoundType } from "../types/RoundType";
import { socket } from "../socket";
import { room } from "../App";

interface GameFinishedProps {
  rounds: RoundType[];
  clients: ClientType[];
}

const GameFinished = ({ rounds, clients }: GameFinishedProps) => {
  const client = clients.find(client => client.id === socket.id);
  const areAllClientsReady = clients.filter(client => !client.isHost).every(client => client.isReady);

  const handleClientDataChanged = (key: keyof ClientType, value: ClientValue) => {
    room.value = {
      ...room.value,
      clients: room.value.clients.map(client => (client.id === socket.id ? { ...client, [key]: value } : client)),
    };

    socket.emit("CLIENT_DATA_CHANGED", key, value);
  };

  const handlePlayAgain = () => {
    room.value = {
      ...room.value,
      status: "lobby",
      rounds: [],
      currentRoundIndex: 0,
    };

    socket.emit("PLAY_AGAIN");
  };

  return (
    <WrapperCard>
      <Stack gap={"4rem"}>
        {rounds.map((round, index) => (
          <Round key={round.id} round={round} currentIndex={index} roomStatus={"finished"}></Round>
        ))}

        {client?.isHost ? (
          <Button
            disabled={!areAllClientsReady}
            variant={areAllClientsReady ? "filled" : "default"}
            onClick={handlePlayAgain}
          >
            {areAllClientsReady ? "Play again" : "All clients must be ready to play again"}
          </Button>
        ) : (
          <Button
            color="teal"
            variant={client?.isReady ? "filled" : "default"}
            onClick={() => handleClientDataChanged("isReady", !client?.isReady)}
          >
            {client?.isReady ? "I'm ready to play again" : "I'm not ready to play again"}
          </Button>
        )}
      </Stack>
    </WrapperCard>
  );
};

export default GameFinished;
