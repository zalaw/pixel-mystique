import { Box, Flex, Text } from "@mantine/core";
import { socket } from "../socket";

const Navbar = () => {
  return (
    <Flex p={"1rem"} justify={"center"}>
      <Flex align={"end"} gap={".5rem"} className="logo">
        <Box className="pixel" bg={"blue"} mb={".20rem"}>
          <Text size={"14px"} fw={500}>
            Pixel
          </Text>
        </Box>
        <Text size={"32px"} fw={700} onClick={() => socket.volatile.emit("TEST")}>
          Mystique
        </Text>
      </Flex>
    </Flex>
  );
};

export default Navbar;
