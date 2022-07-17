import styled from "styled-components";

interface StyledTagWrapper {
  hasMarginRight?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
  status: string;
  ltype: string;
  dragDisabled?: boolean;
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
  cursor: ${({ dragDisabled }) => (dragDisabled ? "default" : "move")};
  border-style: ${({ theme, ltype }) =>
    "solid solid solid " + theme.borderStyle[ltype]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  height: 2.25rem;
`;

interface StyledEntityTag {
  color: string;
  isTemplate: boolean;
}
export const StyledEntityTag = styled.div<StyledEntityTag>`
  background: ${({ color, isTemplate, theme }) =>
    isTemplate
      ? `linear-gradient(-45deg, ${theme.color[color]} 0%, ${theme.color[color]} 50%, ${theme.color["gray"][100]} 50%)`
      : theme.color[color]};
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
  isFavorited: boolean;
  labelOnly?: boolean;
  isItalic?: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  font-style: ${({ isItalic }) => `${isItalic ? "italic" : "normal"}`};
  background-color: ${({ theme, invertedLabel, isFavorited }) =>
    invertedLabel
      ? theme.color["primary"]
      : isFavorited
      ? theme.color["warning"]
      : theme.color["white"]};
  color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.color["white"] : theme.color["black"]};
  border-left-width: ${({ theme, labelOnly }) =>
    labelOnly ? 0 : theme.borderWidth[2]};
  border-left-style: ${({ borderStyle }) => borderStyle};
  border-left-color: ${({ theme, status }) => theme.color[status]};
  max-width: ${({ theme, fullWidth }) =>
    fullWidth ? "100%" : theme.space[52]};
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
export const StyledItalic = styled.i`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
