import { Stack, Button } from "@mantine/core";
import { useGame } from "../hooks/useGame";
import { useNavigate } from "react-router-dom";
import WrapperCard from "./WrapperCard";

const GameNotJoinable = () => {
  const { gameNotJoinableMessage } = useGame();
  const navigate = useNavigate();

  const handleGoBackHome = () => {
    navigate("/");
  };

  return (
    <WrapperCard>
      <Stack>
        {gameNotJoinableMessage}
        <Button onClick={handleGoBackHome}>Go back home</Button>
      </Stack>
    </WrapperCard>
  );
};

export default GameNotJoinable;
