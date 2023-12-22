import { useState, useRef } from "react";
import { Stack, TextInput, Button } from "@mantine/core";
import { useSocket } from "../hooks/useSocket";

interface UpdateNameProps {
  callback?: () => void;
}

const UpdateName = ({ callback }: UpdateNameProps) => {
  const { socket } = useSocket();

  const [isNameError, setIsNameError] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    if (nameInputRef.current!.value.trim() === "") return setIsNameError(true);
    localStorage.setItem("BABAJEE_NAME", nameInputRef.current!.value.trim().slice(0, 32));
    socket?.emit("CLIENT_DATA_CHANGED", "name", nameInputRef.current?.value);
    callback?.();
  };

  return (
    <Stack>
      <TextInput error={isNameError ? "Name must be filled in" : ""} ref={nameInputRef} label="Name" />
      <Button onClick={handleSaveName}>Save</Button>
    </Stack>
  );
};

export default UpdateName;
