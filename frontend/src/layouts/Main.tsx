import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import { Box, Flex } from "@mantine/core";

const Main = () => {
  return (
    <Flex h={"100%"} direction="column">
      <Navbar />

      <Box className="main-padding" style={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default Main;
