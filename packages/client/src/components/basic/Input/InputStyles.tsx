import styled from "styled-components";
import { space1, space2 } from "Theme/constants";
import { ThemeColor, ThemeFontSize } from "Theme/theme";

interface IValueStyle {
  $inverted?: boolean;
  $suggester?: boolean;
  disabled?: boolean;
  width?: number | "full";
  $noBorder?: boolean;
  borderColor?: keyof ThemeColor;
  $autocomplete?: string;
}
const getWidth = (width?: number | "full") => {
  if (width) {
    return width === "full" ? "100%" : `${width / 10}rem`;
  } else {
    return "auto";
  }
};
interface StyledWrapper {
  $fullHeightTextArea: boolean;
  width?: number | "full";
}
export const StyledWrapper = styled.div<StyledWrapper>`
  display: flex;
  height: ${({ $fullHeightTextArea }) => ($fullHeightTextArea ? "100%" : "")};
  flex-grow: ${({ width }) => (width === "full" ? 1 : "")};
`;
export const Label = styled.span`
  text-align: right;
  margin-right: ${space2};
  vertical-align: top;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  display: flex;
  align-items: flex-end;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledInput = styled.input<IValueStyle>`
  height: ${({ theme }) => theme.space[10]};
  text-align: left;
  border-style: solid;
  color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, $inverted }) =>
    $inverted ? 0 : theme.borderWidth[1]};
  border-color: ${({ theme, $suggester, borderColor }) =>
    $suggester
      ? theme.color["primary"]
      : borderColor
      ? theme.color[borderColor]
      : theme.color["gray"]["400"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding-left: ${({ theme }) => theme.space[2]};
  width: ${({ width }) => getWidth(width)};
  min-width: 6rem;
  background: ${({ disabled, theme }) =>
    disabled ? theme.background["stripes"] : ""};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "")};
  resize: none;
  :hover {
    border-color: ${({ theme }) => theme.color["info"]};
    border-width: ${({ theme }) => theme.borderWidth[1]};
  }
  :focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["info"]};
    border-width: ${({ theme }) => theme.borderWidth[1]};
  }
`;

interface StyledTextArea extends IValueStyle {
  $fullHeightTextArea: boolean;
  $fontSizeTextArea: keyof ThemeFontSize;
}
export const StyledTextArea = styled.textarea<StyledTextArea>`
  height: ${({ $fullHeightTextArea }) => ($fullHeightTextArea ? "100%" : "")};
  font-family: inherit;
  text-align: left;
  color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["primary"] : theme.color["white"]};
  border-color: ${({ theme, borderColor }) =>
    borderColor ? theme.color[borderColor] : theme.color["gray"]["400"]};
  border-width: ${({ theme, $inverted, $noBorder }) =>
    $inverted || $noBorder ? 0 : theme.borderWidth[1]};
  font-size: ${({ theme, $fontSizeTextArea }) =>
    theme.fontSize[$fontSizeTextArea]};
  width: ${({ width }) => getWidth(width)};
  padding: ${space1};
  background: ${({ disabled, theme }) =>
    disabled ? theme.background["stripes"] : ""};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "default")};
  resize: none;
  line-height: 1.2;
  :focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["success"]};
    border-width: ${({ theme, $noBorder }) =>
      $noBorder ? 0 : theme.borderWidth[1]};
  }
  :hover {
    border-color: ${({ theme }) => theme.color["info"]};
  }
`;
