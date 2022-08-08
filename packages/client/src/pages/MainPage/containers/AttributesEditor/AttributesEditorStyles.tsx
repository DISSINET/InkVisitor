import styled from "styled-components";
import { Colors } from "types";

interface StyledAttributeModalRow {
  disabled: boolean;
}

export const StyledAttributeModalRow = styled.div<StyledAttributeModalRow>`
  display: ${({ disabled }) => (disabled ? "none" : "grid")};
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;
  grid-template-columns: ${({ theme }) => `auto ${theme.space[64]}`};
`;
export const StyledAttributeModalRowLabel = styled.div`
  margin-top: ${({ theme }) => theme.space[1]};
  display: inline-flex;
`;
export const StyledAttributeModalRowLabelIcon = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
`;

export const StyledAttributeModalRowLabelText = styled.div`
  width: 10em;
  cursor: default;
`;

export const StyledAttributeModalHeaderWrapper = styled.div`
  display: block;
`;

export const StyledAttributeModalHeaderIcon = styled.div`
  display: inline-block;
  margin-right: 2px;
  width: auto;
  vertical-align: text-top;
`;
export const StyledEntityWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  margin-top: 1.5rem;
`;
export const StyledSuggesterWrap = styled.div`
  display: inline-flex;
  margin-top: 1.5rem;
`;
interface StyledContentWrap {
  color?: typeof Colors[number];
}
export const StyledContentWrap = styled.div<StyledContentWrap>`
  max-width: 100%;
  padding-right: 2rem;
  padding-left: 1rem;

  border-left-color: ${({ theme, color }) =>
    color ? theme.color[color] : "black"};
  border-left-width: ${({ color }) => (color ? "3px" : "1px")};
  border-left-style: ${({ color }) => (color ? "solid" : "dashed")};
`;

export const StyledAttributeTable = styled.div``;
