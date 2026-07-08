import styled from "styled-components";
import { ThemeBorderRadius } from "Theme/theme";

interface ButtonGroup {
  $noGap?: boolean;
  $smallGap?: boolean;
  $column?: boolean;
  $marginBottom?: boolean;
  $marginTop?: boolean;
  $height?: number;
  $cornerRadius?: keyof ThemeBorderRadius;
}
export const ButtonGroup = styled.div.attrs({
  className: "buttongroup",
})<ButtonGroup>`
  display: flex;
  height: ${({ $height }) => ($height ? `${$height / 10}rem` : "")};
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  margin-top: ${({ $marginTop, theme }) => ($marginTop ? theme.space[2] : "")};
  margin-bottom: ${({ $marginBottom, theme }) => ($marginBottom ? theme.space[2] : "")};
  border-radius: ${({ $cornerRadius, theme }) =>
    $cornerRadius ? theme.borderRadius[$cornerRadius] : "none"};
  overflow: hidden;
  > button:not(:last-child),
  > span:not(:last-child) {
    margin-right: ${({ $noGap, $smallGap }) => ($noGap ? 0 : $smallGap ? "0.25rem" : "0.5rem")};
  }
`;

interface SwitchGroup {
  $column?: boolean;
  $bgColor?: string;
  $border?: boolean;
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
  border: ${({ theme, $border }) =>
    $border ? `${theme.borderWidth[1]} solid ${theme.color["gray"][300]}` : "none"};

  > button {
    margin: 0;
    display: flex;
    align-items: center;
  }
`;

export const ButtonGroups = styled.div`
  display: flex;
  .buttongroup {
    margin-left: ${({ theme }) => theme.space[1]};
  }
`;
