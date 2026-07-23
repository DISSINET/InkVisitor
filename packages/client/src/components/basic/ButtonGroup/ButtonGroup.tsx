import styled from "styled-components";
import { FlatThemeColor, ThemeBorderRadius } from "Theme/theme";

export type ButtonGroupGap = "no" | "small" | "large";

const gapSize: Record<ButtonGroupGap, string> = {
  no: "0",
  small: "0.25rem",
  large: "0.75rem",
};

interface ButtonGroup {
  $gap?: ButtonGroupGap;
  $column?: boolean;
  $marginBottom?: boolean;
  $marginTop?: boolean;
  $height?: number;
  $borderRadius?: keyof ThemeBorderRadius;
  $disableShrink?: boolean;
}
export const ButtonGroup = styled.div.attrs({
  className: "buttongroup",
})<ButtonGroup>`
  display: flex;
  height: ${({ $height }) => ($height ? `${$height / 10}rem` : "")};
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  margin-top: ${({ $marginTop, theme }) => ($marginTop ? theme.space[2] : "")};
  margin-bottom: ${({ $marginBottom, theme }) => ($marginBottom ? theme.space[2] : "")};
  border-radius: ${({ $borderRadius, theme }) =>
    $borderRadius ? theme.borderRadius[$borderRadius] : "none"};
  overflow: hidden;
  flex-shrink: ${({ $disableShrink }) => ($disableShrink ? 0 : "")};
  > button:not(:last-child),
  > span:not(:last-child) {
    flex-shrink: ${({ $disableShrink }) => ($disableShrink ? 0 : "")};
    /* an ancestor may set --button-group-gap to change the default for its area */
    margin-right: ${({ $gap }) => ($gap ? gapSize[$gap] : "var(--button-group-gap, 0.5rem)")};
  }
`;

interface SwitchGroup {
  $column?: boolean;
  $bgColor?: string;
  $borderColor?: FlatThemeColor;
  $zIndex?: number;
}
export const SwitchGroup = styled.div<SwitchGroup>`
  display: inline-flex;
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  align-items: stretch;
  gap: 0.15rem;
  padding: 0.25rem;
  background-color: ${({ theme, $bgColor }) => $bgColor ?? theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  overflow: hidden;
  border: ${({ theme, $borderColor }) =>
    $borderColor ? `${theme.borderWidth[1]} solid ${theme.color[$borderColor]}` : "none"};
  z-index: ${({ $zIndex }) => $zIndex ?? "auto"};
  > button {
    margin: 0;
    display: flex;
    align-items: center;
  }
  /* the selected option renders bold, which is wider — every label reserves its
     bold width so the segments keep their size as the selection moves */
  > button > span::after {
    content: attr(data-label);
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
    display: block;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
`;

export const ButtonGroups = styled.div`
  display: flex;
  .buttongroup {
    margin-left: ${({ theme }) => theme.space[1]};
  }
`;
