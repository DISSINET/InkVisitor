import styled from "styled-components";
import { Colors } from "types";

interface StyledArrow {
  color: typeof Colors[number];
  rotation: string;
  sizeValidated: number;
  triangleMultiplier: number;
}
const roundHalf = (num: number) => {
  return Math.round(num * 2) / 2;
};
export const StyledArrow = styled.div<StyledArrow>`
  width: 0;
  height: 0;

  border-style: solid;
  border-width: ${({ rotation, sizeValidated, triangleMultiplier }) =>
    rotation === "top" || rotation === "bottom"
      ? `${sizeValidated * triangleMultiplier}px ${sizeValidated}px`
      : `${sizeValidated}px ${sizeValidated * triangleMultiplier}px`};
  border-color: ${({ theme, color }) => theme.color[color]};
  border-bottom-color: ${({ rotation }) =>
    rotation === "top" ? "" : "transparent"};
  border-top-color: ${({ rotation }) =>
    rotation === "bottom" ? "" : "transparent"};
  border-left-color: ${({ rotation }) =>
    rotation === "right" ? "" : "transparent"};
  border-right-color: ${({ rotation }) =>
    rotation === "left" ? "" : "transparent"};

  margin-top: ${({ rotation, sizeValidated, triangleMultiplier }) =>
    rotation === "top"
      ? `-${
          sizeValidated * triangleMultiplier - roundHalf(sizeValidated / 6)
        }px`
      : rotation === "bottom"
      ? `${roundHalf(sizeValidated / 3)}px`
      : 0};

  margin-bottom: ${({ rotation, sizeValidated, triangleMultiplier }) =>
    rotation === "bottom"
      ? `-${
          sizeValidated * triangleMultiplier - roundHalf(sizeValidated / 6)
        }px`
      : rotation === "top"
      ? `${roundHalf(sizeValidated / 3)}px`
      : 0};
  margin-left: ${({ rotation, sizeValidated, triangleMultiplier }) =>
    rotation === "left"
      ? `-${
          sizeValidated * triangleMultiplier - roundHalf(sizeValidated / 6)
        }px`
      : rotation === "right"
      ? `${roundHalf(sizeValidated / 3)}px`
      : 0};

  margin-right: ${({ rotation, sizeValidated, triangleMultiplier }) =>
    rotation === "right"
      ? `-${
          sizeValidated * triangleMultiplier - roundHalf(sizeValidated / 6)
        }px`
      : rotation === "left"
      ? `${roundHalf(sizeValidated / 3)}px`
      : 0};
`;
