import styled from "styled-components";
import { Colors } from "types";

export const StyledAttributeModalRow = styled.div`
  display: inline-flex;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;
`;
export const StyledAttributeModalRowLabel = styled.div`
  display: inline-flex;
  margin-top: ${({ theme }) => theme.space[1]};
`;
export const StyledAttributeModalRowLabelIcon = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  display: inline-flex;
`;

export const StyledAttributeModalRowLabelText = styled.div`
  display: inline-flex;
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
  margin-top: 1rem;
`;
export const StyledSuggesterWrap = styled.div`
  display: inline-flex;
  margin-top: 1rem;
`;
interface StyledContentWrap {
  color?: typeof Colors[number];
}
export const StyledContentWrap = styled.div<StyledContentWrap>`
  display: grid;
  max-width: 100%;
  padding-right: 2rem;
  padding-left: 1rem;

  border-left-color: ${({ theme, color }) =>
    color ? theme.color[color] : "black"};
  border-left-width: ${({ color }) => (color ? "3px" : "1px")};
  border-left-style: ${({ color }) => (color ? "solid" : "dashed")};
`;
