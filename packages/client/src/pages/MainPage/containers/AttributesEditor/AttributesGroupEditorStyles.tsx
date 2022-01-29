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

interface StyledColumnWrap {
  color?: typeof Colors[number];
}
export const StyledColumnWrap = styled.div<StyledColumnWrap>`
  display: grid;
  grid-auto-rows: min-content;
  align-items: start;
  justify-content: start;
  padding-right: 2rem;
  padding-left: 1rem;
  padding-top: 0.5rem;
  border-left-color: ${({ theme, color }) =>
    color ? theme.color[color] : "black"};
  border-left-width: ${({ color }) => (color ? "3px" : "1px")};
  border-left-style: ${({ color }) => (color ? "solid" : "dashed")};

  :hover {
    background-color: ${({ theme }) => theme.color["white"]};
  }
`;
export const StyledTooltipGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-auto-flow: row;
  > div:not(:last-child) {
    padding-right: 1rem;
  }
`;
export const StyledTooltipHeading = styled.p`
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 0.2rem;
`;
export const StyledTooltipColumn = styled.div``;
export const StyledEntityWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  margin-top: 1rem;
`;
export const StyledSuggesterWrap = styled.div`
  display: inline-flex;
  margin-top: 1rem;
`;
