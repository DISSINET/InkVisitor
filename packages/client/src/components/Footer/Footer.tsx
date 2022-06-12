import React from "react";
import { useAppSelector } from "redux/hooks";
import { Colors } from "types";
import { StyledFooter } from "./FooterStyles";

interface Footer {
  height?: number;
  color?: typeof Colors[number];
}
export const Footer: React.FC<Footer> = ({
  height = 30,
  color = "primary",
}) => {
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );

  return (
    <StyledFooter
      height={height}
      color={color}
      layoutWidth={layoutWidth}
    ></StyledFooter>
  );
};

export const MemoizedFooter = React.memo(Footer, () => true);
