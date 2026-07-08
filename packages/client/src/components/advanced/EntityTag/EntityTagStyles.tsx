import { EntityEnums } from "@inkvisitor/shared/enums";
import { FaStar } from "react-icons/fa";
import styled from "styled-components";
import { ThemeColor } from "Theme/theme";

interface StyledEntityTagWrap {}
export const StyledEntityTagWrap = styled.div<StyledEntityTagWrap>`
  display: inline-flex;
  vertical-align: top;
  overflow: hidden;
`;

interface StyledButtonWrapper {
  $tagBorderColorKey: EntityEnums.Status;
}
export const StyledButtonWrapper = styled.div<StyledButtonWrapper>`
  display: flex;
  button {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[2]};
    border-left-color: ${({ theme, $tagBorderColorKey }) =>
      theme.color.tagBorderColor[$tagBorderColorKey]};
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

// wraps the class glyph so the "equivalent" badge can be corner-anchored to it
export const StyledTagComponentWrap = styled.div`
  position: relative;
  display: flex;
  flex-shrink: 0;
`;

// small corner marker shown when an entity was surfaced via an expansion option
// ("include equivalents" -> "eq", "include subordinates" -> "sub")
export const StyledExpansionBadge = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 0.72rem;
  padding: 0 0.12rem;
  border-bottom-right-radius: 4px;
  background: ${({ theme }) => theme.color.white};
  color: ${({ theme }) => theme.color.black};
  font-size: 0.55rem;
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
  letter-spacing: -0.02em;
  pointer-events: none;
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
  $tagBorderColorKey: EntityEnums.Status;
  $isFavorited: boolean;
  $labelOnly?: boolean;
  $isItalic: boolean;
  $maxWidth?: string;
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
  border-left-color: ${({ theme, $tagBorderColorKey }) =>
    theme.color.tagBorderColor[$tagBorderColorKey]};
  border-left-style: solid;
  max-width: ${({ theme, $fullWidth, $maxWidth }) =>
    $maxWidth ? $maxWidth : $fullWidth ? "100%" : theme.space[30]};
  font-weight: ${({ theme, $invertedLabel }) =>
    $invertedLabel ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
`;
