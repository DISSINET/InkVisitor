import styled from "styled-components";

interface StyledTagWrapper {
  hasMarginRight?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
}
export const StyledTagWrapper = styled.div<StyledTagWrapper>`
  display: inline-flex;
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth[2]};
  border-style: ${({ borderStyle }) => borderStyle};
  border-color: ${({ theme }) => theme.color["black"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  margin-right: ${({ theme, hasMarginRight }) =>
    hasMarginRight && theme.space[1]};
  cursor: move;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
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
}
export const StyledLabel = styled.div<StyledLabel>`
  display: inline-block;
  vertical-align: middle;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.color["primary"] : theme.color["white"]};
  color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.color["white"] : theme.color["black"]};
  border-left-width: ${({ theme }) => theme.borderWidth[2]};
  border-left-style: ${({ borderStyle }) => borderStyle};
  border-left-color: ${({ theme }) => theme.color["black"]};
  max-width: ${({ theme, fullWidth }) =>
    fullWidth ? "100%" : theme.space[52]};
`;

export const ButtonWrapper = styled.div`
  display: flex;
`;

export const StyledTooltipSeparator = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
