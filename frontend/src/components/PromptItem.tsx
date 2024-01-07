import { ActionIcon, Flex, Text } from "@mantine/core";
import { IconRestore, IconX } from "@tabler/icons-react";
import { PromptItemType } from "../types/PromptItemType";

interface PromptItemProps {
  loading: boolean;
  item: PromptItemType;
  handleOnIconClick: (id: string) => void;
}

const PromptItem = ({ loading, item, handleOnIconClick }: PromptItemProps) => {
  return (
    <Flex key={item.id} p={"1rem"} justify={"space-between"} align={"center"} bg={"gray.9"}>
      <Text c={item.markedForDeletion ? "gray.7" : ""} fw={600} td={item.markedForDeletion ? "line-through" : "none"}>
        {item.name}
      </Text>

      <ActionIcon disabled={loading} radius={"xl"} color={item.markedForDeletion ? "blue" : "red"} variant="subtle">
        {item.markedForDeletion ? (
          <IconRestore size={"1.5rem"} onClick={() => handleOnIconClick(item.id)} />
        ) : (
          <IconX size={"1.5rem"} onClick={() => handleOnIconClick(item.id)} />
        )}
      </ActionIcon>
    </Flex>
  );
};

export default PromptItem;
