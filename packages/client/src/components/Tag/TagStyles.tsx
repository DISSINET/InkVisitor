import styled from "styled-components";

interface StyledTagWrapper {
  hasMarginRight?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
  status: string;
  ltype: string;
}
export const StyledTagWrapper = styled.div<StyledTagWrapper>`
  display: inline-flex;
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth[2]};
  border-style: ${({ borderStyle }) => borderStyle};
  border-color: ${({ theme, status }) => theme.color[status]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  margin-right: ${({ theme, hasMarginRight }) =>
    hasMarginRight && theme.space[1]};
  cursor: move;
  border-style: ${({ theme, ltype }) =>
    "solid solid solid " + theme.borderStyle[ltype]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  height: 2.25rem;
`;

interface StyledEntityTag {
  color: string;
}
export const StyledEntityTag = styled.div<StyledEntityTag>`
  background-color: ${({ color, theme }) => theme.color[color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-weight: ${({ theme }) => theme.fontWeight["extrabold"]};
  width: ${({ theme }) => theme.space[7]};
`;

interface StyledLabel {
  invertedLabel?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
  fullWidth: boolean;
  status: string;
  favorited: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  background-color: ${({ theme, invertedLabel, favorited }) =>
    invertedLabel
      ? theme.color["primary"]
      : favorited
      ? theme.color["warning"]
      : theme.color["white"]};
  color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.color["white"] : theme.color["black"]};
  border-left-width: ${({ theme }) => theme.borderWidth[2]};
  border-left-style: ${({ borderStyle }) => borderStyle};
  border-left-color: ${({ theme, status }) => theme.color[status]};
  max-width: ${({ theme, fullWidth }) =>
    fullWidth ? "100%" : theme.space[52]};
  font-weight: ${({ theme, favorited }) =>
    favorited ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
`;

interface ButtonWrapper {
  status: string;
}
export const ButtonWrapper = styled.div<ButtonWrapper>`
  display: flex;
  button {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[2]};
    border-left-color: ${({ theme, status }) => theme.color[status]};
    border-left-style: solid;
  }
`;

export const StyledTooltipSeparator = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
