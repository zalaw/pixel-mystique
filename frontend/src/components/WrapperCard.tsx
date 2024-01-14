import React, { HTMLAttributes } from "react";
import { Card } from "@mantine/core";

interface WrapperCardProps extends HTMLAttributes<HTMLDivElement> {
  transparent?: boolean;
  children: React.ReactNode;
}

const WrapperCard = ({ transparent = false, children, ...rest }: WrapperCardProps) => {
  return (
    <Card
      className={transparent ? "" : "main-padding"}
      p={transparent ? 0 : "auto"}
      withBorder={transparent ? false : true}
      bg={transparent ? "transparent" : ""}
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
