import { Button, Stack, Text, TextInput } from "@mantine/core";
import { computed, signal } from "@preact/signals-react";
import { socket } from "../socket";
import PromptItem from "./PromptItem";
import { PromptItemType } from "../types/PromptItemType";
import { showCreateScenarioModal } from "./LobbySettings";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const prompt = signal<string>("");
const extra = signal<string>("");
const scenarioName = signal<string>("");

const loading = signal<boolean>(false);
const responseError = signal<string>("");
const createScenarioError = signal<boolean>(false);
const generatedList = signal<PromptItemType[]>([]);

const itemsMarkedForDeletion = computed(() => generatedList.value.filter(item => item.markedForDeletion));

const handleGenerate = () => {
  if (loading.value) return;

  generatedList.value = [];
  loading.value = true;
  responseError.value = "";

  socket.emit(
    "GENERATE_LIST",
    { prompt: prompt.value.trim() },
    (response: string | Pick<PromptItemType, "id" | "name">[]) => {
      loading.value = false;

      if (typeof response === "string") return (responseError.value = response);

      generatedList.value = response.map(item => ({ ...item, markedForDeletion: false }));
    }
  );
};

const handleToggleDeletion = (id: string) => {
  generatedList.value = generatedList.value.map(item =>
    item.id === id ? { ...item, markedForDeletion: !item.markedForDeletion } : item
  );
};

const handleCreate = () => {
  if (loading.value) return;

  loading.value = true;
  createScenarioError.value = false;

  socket.emit(
    "CREATE_SCENARIO",
    {
      scenarioName: scenarioName.value.trim(),
      list: generatedList.value.filter(item => !item.markedForDeletion).map(item => item.name),
      extra: extra.value.trim(),
    },
    (response: { isError: boolean }) => {
      loading.value = false;

      if (response.isError) return (createScenarioError.value = true);

      generatedList.value = [];
      showCreateScenarioModal.value = false;

      notifications.show({
        color: "teal",
        title: "Success",
        message: "Scenario successfully created",
        icon: <IconCheck />,
        autoClose: 4000,
      });
    }
  );
};

const CreateScenarioModal = () => {
  return (
    <Stack gap={"3rem"}>
      <Stack>
        <TextInput
          error={responseError.value}
          placeholder="E.g: football teams"
          defaultValue={prompt.value}
          label="Prompt"
          onInput={e => (prompt.value = e.currentTarget.value)}
        />

        <Text span>
          Your prompt will be:{" "}
          <Text fw={600} span>
            Generate a list of {prompt.value}
          </Text>
        </Text>
      </Stack>

      <Button disabled={prompt.value.trim() === ""} loading={loading.value} onClick={handleGenerate}>
        Generate
      </Button>

      {generatedList.value.length > 0 ? (
        <>
          <Stack>
            <Text fw={600} fz={"26px"}>
              Total - {generatedList.value.length}
            </Text>

            {generatedList.value
              .filter(item => !item.markedForDeletion)
              .map(item => (
                <PromptItem
                  loading={loading.value}
                  key={item.id}
                  item={item}
                  handleOnIconClick={id => handleToggleDeletion(id)}
                />
              ))}
          </Stack>

          <Stack>
            <Text fw={600} fz={"26px"}>
              Marked for deletion - {itemsMarkedForDeletion.value.length}
            </Text>

            {itemsMarkedForDeletion.value.map(item => (
              <PromptItem
                loading={loading.value}
                key={item.id}
                item={item}
                handleOnIconClick={id => handleToggleDeletion(id)}
              />
            ))}
          </Stack>

          <Stack>
            <TextInput
              placeholder="E.g: badge (if you want only the badges of each football team)"
              defaultValue={extra.value}
              label="Extra info when getting images"
              onInput={e => (extra.value = e.currentTarget.value)}
            />

            <Text>
              Extra info will be: {generatedList.value[0].name} {extra.value}
            </Text>

            <TextInput
              placeholder="E.g: Football Teams"
              defaultValue={scenarioName.value}
              label="Scenario name"
              onInput={e => (scenarioName.value = e.currentTarget.value)}
            />

            {createScenarioError.value ? <Text c={"red"}>Failed to create scenario. Please try again</Text> : null}

            <Button disabled={scenarioName.value.trim() === ""} loading={loading.value} onClick={handleCreate}>
              Create scenario
            </Button>
          </Stack>
        </>
      ) : null}
    </Stack>
  );
};

export default CreateScenarioModal;
