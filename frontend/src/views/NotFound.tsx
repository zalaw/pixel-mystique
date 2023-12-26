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
    <Flex gap={"1rem"} h={"100%"} direction={"column"} align={"center"} justify={"center"}>
      <Text fz={"96px"} fw={600}>
        4{emoji}4
      </Text>
      <Text fw={600}>The page you were looking for does not exist</Text>

      <Flex align={"center"} gap={"1rem"}>
        <Button component={Link} to={"/"}>
          Let's go back home
        </Button>
        <Text>or</Text>
        <Button variant={"subtle"} onClick={getRandomEmoji}>
          Get a random emoji
        </Button>
      </Flex>
    </Flex>
  );
};

export default NotFound;
