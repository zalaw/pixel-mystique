import { useSocket } from "../hooks/useSocket";
import { RoundType } from "../types/RoundType";
import { Text, Flex, Button, Image, SimpleGrid, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { IconClock, IconNumber } from "@tabler/icons-react";
import { useInterval } from "@mantine/hooks";
import { useGame } from "../hooks/useGame";
import Game from "../views/Game";
import { RoomStatusType } from "../types/RoomType";
import { ReactCompareSlider, ReactCompareSliderImage, useReactCompareSliderRef } from "react-compare-slider";

interface RoundProps {
  round: RoundType;
  index: number;
  seconds?: number;
  totalRounds?: number;
  status?: RoomStatusType;
}

const Round = ({ round, index, seconds, totalRounds, status = "lobby" }: RoundProps) => {
  const { socket } = useSocket();
  const { colors } = useGame();
  const [answerPickedId, setAnswerPickedId] = useState("");
  const [s, setS] = useState(seconds || 1 - 1);

  const interval = useInterval(() => setS(curr => curr - 1), 1000);
  const reactCompareSliderRef = useReactCompareSliderRef();

  useEffect(() => {
    if (!seconds) return;

    interval.stop();
    interval.start();

    socket?.on("NEXT_ROUND", () => {
      setS(seconds - 1);
      interval.stop();
      interval.start();
      setAnswerPickedId("");
    });
  }, []);

  useEffect(() => {
    if (s <= 0) {
      interval.stop();
    }
  }, [s]);

  const handleAnswerOnClick = (id: string) => {
    if (answerPickedId === id || round.correctAnswerId) return;

    setAnswerPickedId(id);
    socket?.emit("CLIENT_DATA_CHANGED", "isAnswerPicked", true);
    socket?.emit("ANSWER", id);
  };

  const secondsToMMSS = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  return (
    <Stack>
      {seconds && (
        <Flex justify={"space-between"}>
          <Flex align={"center"} gap={".5rem"}>
            <IconClock />
            <Text fw={700} fz={22}>
              {secondsToMMSS(s)}
            </Text>
          </Flex>

          <Flex align={"center"} gap={".5rem"}>
            <IconNumber />
            <Text fw={700} fz={22}>
              {index + 1} / {totalRounds}
            </Text>
          </Flex>
        </Flex>
      )}

      {status === "finished" ? (
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={URL.createObjectURL(new Blob([round.image]))} />}
          itemTwo={<ReactCompareSliderImage src={URL.createObjectURL(new Blob([round.originalImage]))} />}
        />
      ) : (
        <Image m={"auto"} src={URL.createObjectURL(new Blob([round.image]))} />
      )}

      <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 2, lg: 2 }} w={"100%"}>
        {round.answers.map(answer => (
          <Button
            key={answer.id}
            color={round.correctAnswerId === answer.id ? "teal" : ""}
            w={"100%"}
            variant={answerPickedId === answer.id || round.correctAnswerId === answer.id ? "filled" : "default"}
            onClick={() => handleAnswerOnClick(answer.id)}
          >
            {answer.text}

            {answer.pickedBy.length > 0 && (
              <Flex className="answer-clients" gap={".25rem"}>
                {answer.pickedBy.map(client => (
                  <div key={client.id} style={{ backgroundColor: colors[client.index] }} className="circle"></div>
                ))}
              </Flex>
            )}
          </Button>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default Round;
