import { RoundType } from "../types/RoundType";
import { Button, Flex, Image, SimpleGrid, Stack } from "@mantine/core";
import { socket } from "../socket";
import { signal } from "@preact/signals-react";
import { colors } from "../App";
import RoundHeader from "./RoundHeader";
import { RoomStatusType } from "../types/RoomType";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useEffect } from "react";

interface RoundProps {
  round: RoundType;
  currentIndex: number;
  roomStatus: RoomStatusType;
  totalRounds?: number;
  duration?: number;
}

const answerPickedId = signal<string>("");

const Round = ({ round, currentIndex, totalRounds, duration, roomStatus }: RoundProps) => {
  const handleAnswerOnClick = (id: string) => {
    if (roomStatus === "finished" || answerPickedId.value === id || round.correctAnswerId) return;

    answerPickedId.value = id;

    socket.emit("CLIENT_DATA_CHANGED", "isAnswerPicked", true);
    socket.emit("ANSWER", id);
  };

  useEffect(() => {
    answerPickedId.value = "";
  }, [currentIndex]);

  return (
    <Stack>
      <div style={{ display: "none" }}>{answerPickedId.value}</div>

      {roomStatus === "in-game" ? (
        <RoundHeader duration={duration || 0} currentIndex={currentIndex} totalRounds={totalRounds || 0} />
      ) : null}

      {roomStatus === "in-game" ? (
        <Image m={"auto"} src={URL.createObjectURL(new Blob([round.image]))} />
      ) : (
        <ReactCompareSlider
          onlyHandleDraggable={true}
          itemOne={<ReactCompareSliderImage src={URL.createObjectURL(new Blob([round.image]))} />}
          itemTwo={<ReactCompareSliderImage src={URL.createObjectURL(new Blob([round.originalImage]))} />}
        />
      )}

      <SimpleGrid cols={{ base: 1, xs: 1, sm: 2, md: 2, lg: 2 }} w={"100%"}>
        {round.answers.map(answer => (
          <Button
            key={answer.id}
            w={"100%"}
            color={round.correctAnswerId === answer.id ? "teal" : ""}
            variant={answerPickedId.value === answer.id || round.correctAnswerId === answer.id ? "filled" : "default"}
            onClick={() => handleAnswerOnClick(answer.id)}
          >
            {answer.text}

            {answer.pickedBy.length > 0 ? (
              <Flex className="answer-clients" gap={".25rem"}>
                {answer.pickedBy.map(client => (
                  <div key={client.id} style={{ backgroundColor: colors.value[client.index] }} className="circle"></div>
                ))}
              </Flex>
            ) : null}
          </Button>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default Round;
