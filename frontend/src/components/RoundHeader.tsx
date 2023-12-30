import { useEffect, useState } from "react";
import { Flex, Text } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { IconClock, IconNumber } from "@tabler/icons-react";

interface RoundHeaderProps {
  currentIndex: number;
  totalRounds: number;
  duration: number;
}

const RoundHeader = ({ currentIndex, totalRounds, duration }: RoundHeaderProps) => {
  const [seconds, setSeconds] = useState(duration);
  const interval = useInterval(() => setSeconds(s => s - 1), 1000);

  const secondsToMMSS = (seconds: number): string => {
    const minutes: number = Math.floor(seconds / 60);
    const remainingSeconds: number = seconds % 60;

    const formattedMinutes: string = String(minutes).padStart(2, "0");
    const formattedSeconds: string = String(remainingSeconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
  };

  useEffect(() => {
    setSeconds(duration);

    interval.stop();
    interval.start();
  }, [currentIndex]);

  useEffect(() => {
    if (seconds < 1) {
      interval.stop();
    }
  }, [seconds]);

  return (
    <Flex justify={"space-between"} align={"center"}>
      <Flex align={"center"} gap={".5rem"}>
        <IconClock size={"2rem"} />
        <Text fw={600} fz={"24px"}>
          {secondsToMMSS(seconds)}
        </Text>
      </Flex>

      <Flex align={"center"} gap={".5rem"}>
        <IconNumber size={"2.5rem"} />
        <Text fw={600} fz={"24px"}>
          {currentIndex + 1} / {totalRounds}
        </Text>
      </Flex>
    </Flex>
  );
};

export default RoundHeader;
