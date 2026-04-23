import { EntityEnums } from "@shared/enums";
import { FaStar } from "react-icons/fa";
import styled from "styled-components";
import { ThemeColor } from "Theme/theme";

interface StyledEntityTagWrap {
  $dragDisabled: boolean;
}
export const StyledEntityTagWrap = styled.div<StyledEntityTagWrap>`
  display: inline-flex;
  vertical-align: top;
  overflow: hidden;
  cursor: ${({ $dragDisabled }) => ($dragDisabled ? "default" : "move")};
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

interface StyledEntityTag {
  $color: keyof ThemeColor;
  $isTemplate: boolean;
}
export const StyledEntityTag = styled.div<StyledEntityTag>`
  background: ${({ $color, $isTemplate, theme }) =>
    $isTemplate
      ? `linear-gradient(-45deg, ${theme.color[$color]} 0%, ${theme.color[$color]} 50%, ${theme.color["gray"][100]} 50%)`
      : theme.color[$color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.space[7]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

interface StyledLabelWrap {
  $invertedLabel: boolean;
}
export const StyledLabelWrap = styled.div<StyledLabelWrap>`
  display: inline-flex;
  overflow: hidden;
  background-color: ${({ theme, $invertedLabel }) =>
    $invertedLabel ? theme.color.tagSelectedBackground : theme.color.tagBackground};
`;
interface StyledStarWrap {}
export const StyledStarWrap = styled.div<StyledStarWrap>`
  display: inline-flex;
  align-items: center;
  height: 100%;
  margin-left: 0.2rem;
`;

interface StyledFaStar {}
export const StyledFaStar = styled(FaStar)<StyledFaStar>`
  color: ${({ theme }) => theme.color.warning};
  margin-bottom: 0.1rem;
`;

const getColor = (
  $invertedLabel: boolean,
  $isFavorited: boolean,
  $isItalic: boolean
): keyof ThemeColor => {
  if ($invertedLabel) {
    if ($isFavorited) {
      return "warning";
    } else {
      return "tagSelectedColor";
    }
  } else {
    return $isItalic ? "tagItalic" : "tagColor";
  }
};
interface StyledLabel {
  $invertedLabel: boolean;
  $fullWidth: boolean;
  $status: EntityEnums.Status;
  $isFavorited: boolean;
  $labelOnly?: boolean;
  $isItalic: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  padding-left: ${({ theme, $isFavorited }) => ($isFavorited ? theme.space[1] : "")};
  font-style: ${({ $isItalic }) => `${$isItalic ? "italic" : "normal"}`};
  color: ${({ theme, $invertedLabel, $isItalic, $isFavorited }) =>
    theme.color[getColor($invertedLabel, $isFavorited, $isItalic)]};
  border-left-width: ${({ theme, $labelOnly }) => ($labelOnly ? 0 : theme.borderWidth[2])};
  border-left-color: ${({ theme, $status }) => theme.color.tagStatus[$status]};
  border-left-style: solid;
  max-width: ${({ theme, $fullWidth }) => ($fullWidth ? "100%" : theme.space[30])};
  font-weight: ${({ theme, $invertedLabel }) =>
    $invertedLabel ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
`;
