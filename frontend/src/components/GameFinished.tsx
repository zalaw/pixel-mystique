import { Stack, Button } from "@mantine/core";
import WrapperCard from "./WrapperCard";
import { useGame } from "../hooks/useGame";
import Round from "./Round";
import { useSocket } from "../hooks/useSocket";
import { ClientType, ClientValue } from "../types/ClientType";

const GameFinished = () => {
  const { socket } = useSocket();
  const { room, setRoom } = useGame();

  const client = room.clients.find(client => client.id === socket!.id);
  const areAllClientsReady = room.clients.filter(client => !client.isHost).every(client => client.isReady);

  const handleClientDataChanged = (key: keyof ClientType, value: ClientValue) => {
    setRoom(curr => ({
      ...curr,
      clients: curr.clients.map(client => (client.id === socket!.id ? { ...client, [key]: value } : client)),
    }));
    socket?.emit("CLIENT_DATA_CHANGED", key, value);
  };

  const handlePlayAgain = () => {
    setRoom(curr => ({
      ...curr,
      status: "lobby",
      rounds: [],
      currentRoundIndex: 0,
    }));
    socket?.emit("PLAY_AGAIN");
  };

  return (
    <WrapperCard>
      <Stack gap={"4rem"}>
        {room.rounds.map(round => (
          <Round key={round.id} round={round} index={room.currentRoundIndex} status={room.status}></Round>
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
