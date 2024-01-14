import { Box, Flex, Text, Title } from "@mantine/core";
import { socket } from "../socket";

const Navbar = () => {
  return (
    <Flex className="main-padding" justify={"center"}>
      <Flex align={"center"} gap={".5rem"} className="logo">
        <Box className="pixel" bg={"rgb(25,113,194)"}>
          <Text size={"14px"} fw={500}>
            Pixel
          </Text>
        </Box>
        <Title order={3} onClick={() => socket.volatile.emit("TEST")}>
          Mystique
        </Title>
      </Flex>
    </Flex>
  );
};

export default Navbar;
