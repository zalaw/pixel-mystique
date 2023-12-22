import { useState, useEffect, useRef } from "react";
import { Stack, TextInput, Button } from "@mantine/core";
import { useSocket } from "../hooks/useSocket";
import { useGame } from "../hooks/useGame";
import WrapperCard from "../components/WrapperCard";
import { defaultState } from "../contexts/GameContext";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const { socket } = useSocket();
  const { setRoom, setGameNotJoinableMessage } = useGame();
  const [isNameError, setIsNameError] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleCreateGame = () => {
    if (loading) return;
    if (nameInputRef.current!.value.trim() === "") return setIsNameError(true);

    setLoading(true);
    socket?.connect();
    socket?.emit("CREATE_ROOM", nameInputRef.current!.value);
  };

  const handleUpdateName = () => {
    setIsNameError(false);
    localStorage.setItem("BABAJEE_NAME", nameInputRef.current!.value.trim().slice(0, 32));
  };

  useEffect(() => {
    setRoom({ ...defaultState.room });
    setGameNotJoinableMessage("");
    const name = localStorage.getItem("BABAJEE_NAME") || "";
    if (nameInputRef.current) nameInputRef.current.value = name;
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket?.on("ROOM_CREATED", ({ code, name }: { code: string; name: string }) => {
      setRoom(curr => ({
        ...curr,
        code,
        clients: [
          {
            id: socket.id,
            index: 0,
            name,
            isHost: true,
            isReady: false,
            isAnswerPicked: false,
          },
        ],
      }));
      navigate(`/game/${code}`);
      setLoading(false);
    });
  }, [socket]);

  return (
    <WrapperCard>
      <Stack>
        <TextInput
          error={isNameError ? "Name must be filled in" : ""}
          ref={nameInputRef}
          label="Name"
          onBlur={handleUpdateName}
        />
        <Button loading={loading} onClick={handleCreateGame}>
          Create game
        </Button>
      </Stack>
    </WrapperCard>
  );
};

export default Welcome;
