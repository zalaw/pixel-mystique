import { useEffect, useState } from "react";
import { useInterval } from "@mantine/hooks";
import { Button, Stack, Text } from "@mantine/core";

const CountdownTest = () => {
  const [seconds, setSeconds] = useState(0);
  const interval = useInterval(() => setSeconds(s => s + 1), 1000);

  useEffect(() => {
    interval.start();
    return interval.stop;
  }, []);

  return (
    <Stack align="center">
      <Text>
        Page loaded <b>{seconds}</b> seconds ago
      </Text>
      <Button onClick={interval.toggle} color={interval.active ? "red" : "teal"}>
        {interval.active ? "Stop" : "Start"} counting
      </Button>
    </Stack>
  );
};

export default CountdownTest;
