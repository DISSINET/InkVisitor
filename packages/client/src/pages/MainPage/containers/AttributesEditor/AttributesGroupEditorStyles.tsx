import { ActantType } from "@shared/enums";
import styled from "styled-components";
import { Colors } from "types";

export const StyledColumnHeading = styled.h6`
  margin-bottom: 1rem;
`;

export const StyledGridColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-flow: row;
  width: 100%;
  height: 100%;
`;

export const StyledAttributesColumn = styled.div`
  display: grid;
  padding-right: 2rem;
  justify-content: flex-start;
`;
interface StyledColumnWrap {
  color?: typeof Colors[number];
}
export const StyledColumnWrap = styled.div<StyledColumnWrap>`
  padding-left: 1rem;
  border-left-color: ${({ theme, color }) =>
    color ? theme.color[color] : "black"};
  border-left-width: ${({ color }) => (color ? "3px" : "1px")};
  border-left-style: ${({ color }) => (color ? "solid" : "dashed")};
`;
