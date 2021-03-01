import styled from "styled-components";

import { space3, space10 } from "Theme/constants";

interface StyledHeader {
  bgColor: string;
  paddingX?: number;
  paddingY?: number;
  height: number | "auto";
}
export const StyledHeader = styled.div<StyledHeader>`
  height: ${({ height }) => (height === "auto" ? "auto" : `${height}px`)};
  padding: ${({ paddingX, paddingY }) =>
    `${paddingY ? paddingY : space10} ${paddingX ? paddingX : space3}`};
  width: 100%;
  background-color: ${({ theme, bgColor }) => theme.colors[bgColor]};
  color: ${({ theme }) => theme.colors["white"]};
  display: flex;
  overflow-y: hidden;
`;

export const TextLeft = styled.div`
  flex: 1 1 0%;
  align-self: center;
  text-align: left;
  /* background-color: palevioletred; */
`;
export const TextRight = styled.div`
  flex: 1 1 0%;
  align-self: center;
  text-align: right;
  /* background-color: paleturquoise; */
`;
