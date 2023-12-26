import { useNavigate } from "react-router-dom";
import { Stack, Button } from "@mantine/core";

import WrapperCard from "./WrapperCard";

interface GameNotJoinableProps {
  message: string;
}

const GameNotJoinable = ({ message }: GameNotJoinableProps) => {
  const navigate = useNavigate();

  const handleGoBackHome = () => {
    navigate("/");
  };

  return (
    <WrapperCard>
      <Stack>
        {message}
        <Button onClick={handleGoBackHome}>Go back home</Button>
      </Stack>
    </WrapperCard>
  );
};

export default GameNotJoinable;
