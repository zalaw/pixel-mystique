import { Button, Stack, Text, TextInput } from "@mantine/core";
import { signal } from "@preact/signals-react";

const scenarioName = signal<string>("");
const input = signal<string>("");

const CreateScenario = () => {
  return (
    <Stack>
      <TextInput
        label="Scenario name"
        description="This value will be displayed in the dropdown"
        defaultValue={scenarioName.value}
        onInput={e => (scenarioName.value = (e.target as HTMLInputElement).value)}
      />

      <TextInput
        defaultValue={input.value}
        label="Input"
        onInput={e => (input.value = (e.target as HTMLInputElement).value)}
      />

      <Text fw={700} span>
        The prompt will be: <Text fs={"italic"} span>{`Give me a list of 20 ${input}`}</Text>
      </Text>

      <Button>Generate</Button>
    </Stack>
  );
};

export default CreateScenario;
