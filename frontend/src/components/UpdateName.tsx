import { Stack, TextInput, Button } from "@mantine/core";
import { socket } from "../socket";
import { name } from "../App";
import { useState } from "react";

const UpdateName = () => {
  const [localName, setLocalName] = useState("");

  const disabled = localName.trim() === "";

  const handleUpdateName = (value: string) => {
    setLocalName(value);
    localStorage.setItem("BABAJEE_NAME", name.value);
  };

  const handleSaveName = (e?: React.FormEvent<HTMLFormElement | HTMLButtonElement>) => {
    if (e) e.preventDefault();
    if (disabled) return;

    name.value = localName;
    socket.emit("CLIENT_DATA_CHANGED", "name", name.value);
  };

  return (
    <form onSubmit={handleSaveName} autoComplete={"off"}>
      <Stack>
        <TextInput
          defaultValue={localName}
          label="Name"
          onInput={e => handleUpdateName((e.target as HTMLInputElement).value)}
        />
        <Button disabled={disabled} onClick={handleSaveName}>
          Save
        </Button>
      </Stack>
    </form>
  );
};

export default UpdateName;
