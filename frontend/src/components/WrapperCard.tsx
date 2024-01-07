import React, { HTMLAttributes } from "react";
import { Card } from "@mantine/core";

interface WrapperCardProps extends HTMLAttributes<HTMLDivElement> {
  transparent?: boolean;
  p?: number | string;
  children: React.ReactNode;
}

const WrapperCard = ({ transparent = false, p = "1.5rem", children, ...rest }: WrapperCardProps) => {
  return (
    <Card
      withBorder={transparent ? false : true}
      bg={transparent ? "transparent" : ""}
      p={p}
      w={"100%"}
      maw={"40rem"}
      m={"auto"}
      {...rest}
    >
      {children}
    </Card>
  );
};

export default WrapperCard;
