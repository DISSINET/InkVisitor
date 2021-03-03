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
    `${paddingY || paddingY === 0 ? `${paddingY}px` : space10} ${
      paddingX || paddingX === 0 ? `${paddingX}px` : space3
    }`};
  width: 100%;
  background-color: ${({ theme, bgColor }) => theme.colors[bgColor]};
  color: ${({ theme }) => theme.colors["white"]};
  display: flex;
  overflow-y: hidden;
`;

export const TextLeft = styled.div`
  display: flex;
  flex: 1 1 0%;
  align-self: center;
`;
export const TextRight = styled.div`
  display: flex;
  flex: 1 1 0%;
  align-self: center;
  justify-content: flex-end;
`;
