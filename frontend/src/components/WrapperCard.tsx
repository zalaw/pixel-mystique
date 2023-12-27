import React from "react";
import { Card } from "@mantine/core";

interface WrapperCardProps {
  transparent?: boolean;
  p?: number | string;
  children: React.ReactNode;
}

const WrapperCard = ({ transparent = false, p = "3.5%", children }: WrapperCardProps) => {
  return (
    <Card bg={transparent ? "transparent" : ""} p={p} w={"100%"} maw={"40rem"} m={"auto"}>
      {children}
    </Card>
  );
};

export default WrapperCard;
