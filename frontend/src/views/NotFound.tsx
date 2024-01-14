import { Button, Flex, Text } from "@mantine/core";
import { signal } from "@preact/signals-react";
import { Link } from "react-router-dom";

const emoji = signal("😢");

const NotFound = () => {
  const getRandomEmoji = () => {
    const randomUnicode = Math.floor(Math.random() * (0x1f64f - 0x1f600 + 1) + 0x1f600);
    emoji.value = String.fromCodePoint(randomUnicode);
  };

  return (
    <Flex gap={"2rem"} h={"100%"} direction={"column"} align={"center"} justify={"center"}>
      <Flex direction={"column"}>
        <Text ta={"center"} className="not-found-text">
          4{emoji}4
        </Text>
        <Text ta={"center"} px={"1rem"} fw={600}>
          The page you were looking for does not exist
        </Text>
      </Flex>

      <Flex align={"center"} gap={"1rem"}>
        <Button component={Link} to={"/"}>
          Let's go home
        </Button>
        <Text>or</Text>
        <Button color="pink" onClick={getRandomEmoji}>
          Random emoji
        </Button>
      </Flex>
    </Flex>
  );
};

export default NotFound;
