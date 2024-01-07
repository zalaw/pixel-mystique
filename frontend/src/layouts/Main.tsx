import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { Box, Flex } from "@mantine/core";

const Main = () => {
  return (
    <Flex h={"100%"} direction="column">
      <Navbar />

      <Box style={{ flexGrow: 1 }} py={"2rem"} px={"1.5rem"}>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Main;
