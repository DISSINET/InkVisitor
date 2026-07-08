import styled from "styled-components";
import { ThemeBorderWidth, ThemeColor, ThemeFontSize } from "Theme/theme";
import { space1, space2 } from "Theme/theme-space-shortcut";

interface IValueStyle {
  $inverted?: boolean;
  $suggester?: boolean;
  disabled?: boolean;
  width?: number | "full";
  $noBorder?: boolean;
  $borderColor?: keyof ThemeColor;
  $borderWidth?: keyof ThemeBorderWidth;
  $autocomplete?: string;
  $fullHeight?: boolean;
  $iconCount?: number;
  $roundCorners?: boolean;
  $icon?: React.ReactNode;
  $rightPadding?: number;
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
  $minWidth?: number;
  $fullHeight?: boolean;
}
export const StyledWrapper = styled.div<StyledWrapper>`
  display: flex;
  align-items: center;
  height: ${({ $fullHeightTextArea }) => ($fullHeightTextArea ? "100%" : "")};
  height: ${({ $fullHeight }) => ($fullHeight ? "100%" : "")};
  flex-grow: ${({ width }) => (width === "full" ? 1 : "")};
  min-width: ${({ $minWidth }) => ($minWidth ? `${$minWidth}px` : "")};
`;
export const Label = styled.span<{ $labelSpaceNoWrap: boolean }>`
  text-align: right;
  margin-right: ${space2};
  vertical-align: top;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  display: flex;
  align-items: flex-end;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  white-space: ${({ $labelSpaceNoWrap }) => ($labelSpaceNoWrap ? "nowrap" : "normal")};
`;
export const StyledInput = styled.input<IValueStyle>`
  height: ${({ $fullHeight, theme }) => ($fullHeight ? "100%" : theme.space[10])};
  text-align: left;
  border-style: solid;
  border-radius: ${({ $roundCorners, theme }) => ($roundCorners ? theme.borderRadius.input : "0")};
  color: ${({ $inverted, theme }) => ($inverted ? theme.color["white"] : theme.color["primary"])};
  background-color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, $inverted, $borderWidth }) =>
    $inverted ? 0 : $borderWidth ? theme.borderWidth[$borderWidth] : theme.borderWidth[1]};
  border-color: ${({ theme, $suggester, $borderColor }) =>
    $suggester
      ? theme.color["primary"]
      : $borderColor
        ? theme.color[$borderColor]
        : theme.color["gray"]["400"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding-left: ${({ theme, $icon, $suggester }) =>
    $icon ? "2.5rem" : $suggester ? "0.1rem" : theme.space[2]};

  padding-right: ${({ theme, $iconCount, $rightPadding }) => {
    // Explicit pixel padding (e.g. measured rightContent width) wins.
    if ($rightPadding) return `${$rightPadding}px`;
    if (!$iconCount) return theme.space[1];
    // 1 icon = space[7], 2 icons = space[10]
    return $iconCount === 1 ? theme.space[7] : theme.space[14];
  }};

  width: ${({ width }) => getWidth(width)};
  min-width: ${({ theme }) => theme.space[6]};
  background: ${({ disabled, theme }) => (disabled ? theme.background["stripes"] : "")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "")};
  resize: none;

  &:hover {
    border-color: ${({ theme, disabled }) => (!disabled ? theme.color["info"] : "")};
    border-width: ${({ theme, disabled }) => (!disabled ? theme.borderWidth[1] : "")};
  }
  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["info"]};
    box-shadow: ${({ $suggester, theme }) =>
      $suggester ? "none" : `inset 0 0 0 0.1rem ${theme.color["info"]}`};
  }
  &::placeholder {
    font-size: 1.1rem;
    color: ${({ theme }) => theme.color["gray"][500]};
    font-weight: inherit;
    text-decoration: none;
  }

  /* Theming for native datetime picker icon */
  &[type="datetime-local"] {
    /* Hint the UA to render internal controls in the correct scheme */
    /* color-scheme: ${({ theme }) => theme.color.primary}; */
  }

  /* Chrome/Safari specific calendar icon */
  &[type="datetime-local"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    /* Fallback coloring so the icon remains visible in dark mode */
    filter: ${({ theme }) =>
      theme.color.white === "#060c26" ? "invert(1) brightness(0.9)" : "none"};
    opacity: 0.85;
  }
  &[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
  /* Chrome/Safari specific calendar icon */
  &[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    /* Fallback coloring so the icon remains visible in dark mode */
    filter: ${({ theme }) =>
      theme.color.white === "#060c26" ? "invert(1) brightness(0.9)" : "none"};
    opacity: 0.85;
  }
  &[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
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
  color: ${({ $inverted, theme }) => ($inverted ? theme.color["white"] : theme.color["primary"])};
  background-color: ${({ $inverted, theme }) =>
    $inverted ? theme.color["primary"] : theme.color["white"]};
  border-color: ${({ theme, $borderColor }) =>
    $borderColor ? theme.color[$borderColor] : theme.color["gray"]["400"]};
  border-width: ${({ theme, $inverted, $noBorder }) =>
    $inverted || $noBorder ? 0 : theme.borderWidth[1]};
  font-size: ${({ theme, $fontSizeTextArea }) => theme.fontSize[$fontSizeTextArea]};
  width: ${({ width }) => getWidth(width)};
  padding: ${space1};
  padding-right: ${({ $rightPadding }) => ($rightPadding ? `${$rightPadding}px` : "")};
  background: ${({ disabled, theme }) => (disabled ? theme.background["stripes"] : "")};
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "default")};
  resize: none;
  line-height: 1.2;
  border-radius: ${({ $roundCorners, theme }) => ($roundCorners ? theme.borderRadius.input : "0")};

  &:focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["success"]};
    border-width: ${({ theme, $noBorder }) => ($noBorder ? 0 : theme.borderWidth[1])};
    &:focus {
      border-color: ${({ theme }) => theme.color["info"]};
      box-shadow: ${({ theme, $noBorder }) =>
        $noBorder ? "none" : `inset 0 0 0 0.1rem ${theme.color["info"]}`};
    }
  }
  &:hover {
    border-color: ${({ theme, disabled }) => (!disabled ? theme.color["info"] : "")};
  }
`;

interface StyledClearableInputButton {
  $rightOffset?: number;
}
export const StyledClearableInputButton = styled.div<StyledClearableInputButton>`
  position: absolute;
  right: ${({ $rightOffset }) => ($rightOffset ? `${$rightOffset + 7}px` : "0.25rem")};
  display: flex;
  cursor: pointer;
  top: 50%;
  transform: translateY(-50%);
  svg {
    color: ${({ theme }) => theme.color["gray"][500]};
    opacity: 0.7;
  }
`;

export const StyledActionButtonGroup = styled.div`
  position: absolute;
  right: 0.4rem;
  display: flex;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
`;

export const StyledActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  border: none;
  transition: opacity 0.2s ease;
  opacity: 0.7;

  svg {
    color: ${({ theme }) => theme.color["primary"]};
  }

  &:hover {
    opacity: 1;
  }

  &:focus {
    outline: none;
  }
`;

export const StyledIconWrapper = styled.div`
  position: absolute;
  left: 0rem;
  width: 2.8rem;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color["gray"][500]};

  /* Icons passed via the icon prop are centered here; strip any margin they
     could carry so they stay centered. */
  svg {
    margin: 0;
  }
`;

// Default divider height, independent of the button/input height. Override per
// call site via the `dividerHeight` prop.
export const DEFAULT_DIVIDER_HEIGHT = "1.3rem";

export const StyledRightContent = styled.div<{
  $showDivider?: boolean;
}>`
  position: absolute;
  right: 0.3rem;
  top: 0.3rem;
  bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  padding-left: ${({ $showDivider }) => ($showDivider ? "0.4rem" : "0")};

  &::before {
    content: ${({ $showDivider }) => ($showDivider ? '""' : "none")};
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: ${DEFAULT_DIVIDER_HEIGHT};
    width: ${({ theme }) => theme.borderWidth[1]};
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;
