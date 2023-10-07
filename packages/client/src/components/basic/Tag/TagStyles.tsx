import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledTagWrapper {
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
  cursor: ${({ dragDisabled }) => (dragDisabled ? "default" : "move")};
  border-style: ${({ theme, ltype }) =>
    "solid solid solid " + theme.borderStyle[ltype]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  height: 2.25rem;
`;

interface StyledEntityTag {
  $color: keyof ThemeColor;
  isTemplate: boolean;
}
export const StyledEntityTag = styled.div<StyledEntityTag>`
  background: ${({ $color, isTemplate, theme }) =>
    isTemplate
      ? `linear-gradient(-45deg, ${theme.color[$color]} 0%, ${theme.color[$color]} 50%, ${theme.color["gray"][100]} 50%)`
      : theme.color[$color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  width: ${({ theme }) => theme.space[7]};
`;

const getColor = (
  invertedLabel: boolean,
  isFavorited: boolean,
  isItalic: boolean
): string => {
  if (invertedLabel) {
    if (isFavorited) {
      return "warning";
    } else {
      return isItalic ? "grey" : "white";
    }
  } else {
    return isItalic ? "greyer" : "black";
  }
};

interface StyledLabelWrap {
  invertedLabel: boolean;
}
export const StyledLabelWrap = styled.div<StyledLabelWrap>`
  display: inline-flex;
  overflow: hidden;
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.color["primary"] : theme.color["white"]};
`;
interface StyledStarWrap {}
export const StyledStarWrap = styled.div<StyledStarWrap>`
  display: inline-flex;
  align-items: center;
  height: 100%;
  margin-left: 0.2rem;
`;

interface StyledLabel {
  invertedLabel: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
  fullWidth: boolean;
  status: string;
  isFavorited: boolean;
  labelOnly?: boolean;
  isItalic: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  padding-left: ${({ theme, isFavorited }) =>
    isFavorited ? theme.space[1] : ""};
  font-style: ${({ isItalic }) => `${isItalic ? "italic" : "normal"}`};
  color: ${({ theme, invertedLabel, isItalic, isFavorited }) =>
    theme.color[getColor(invertedLabel, isFavorited, isItalic)]};
  border-left-width: ${({ theme, labelOnly }) =>
    labelOnly ? 0 : theme.borderWidth[2]};
  border-left-style: ${({ borderStyle }) => borderStyle};
  border-left-color: ${({ theme, status }) => theme.color[status]};
  max-width: ${({ theme, fullWidth }) =>
    fullWidth ? "100%" : theme.space[30]};
  font-weight: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
`;

interface StyledButtonWrapper {
  status: string;
}
export const StyledButtonWrapper = styled.div<StyledButtonWrapper>`
  display: flex;
  button {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[2]};
    border-left-color: ${({ theme, status }) => theme.color[status]};
    border-left-style: solid;
  }
`;
export const StyledElvlWrapper = styled.div`
  display: flex;
  > div {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[1]};
    border-left-color: ${({ theme }) => theme.color["black"]};
    border-left-style: solid;
  }
`;

export const StyledItalic = styled.i`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
