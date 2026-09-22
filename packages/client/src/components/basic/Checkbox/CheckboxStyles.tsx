import styled, { css, keyframes } from "styled-components";
import { FlatThemeColor } from "Theme/theme";

const checkmarkPop = keyframes`
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

// the box and its label form one control: the gap between them lives inside
// this element so moving across it never leaves the hovered area
interface StyledCheckbox {
  $disabled?: boolean;
}
export const StyledCheckbox = styled.div<StyledCheckbox>`
  color: ${({ theme, $disabled }) =>
    $disabled ? theme.color["gray"][500] : theme.color["black"]};
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  width: fit-content;
`;

interface StyledLabel {
  $disabled?: boolean;
}
export const StyledLabel = styled.label<StyledLabel>`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  user-select: none;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  display: flex;
  align-items: center;
`;

interface StyledCheckboxIndicator {
  $checked: boolean;
  $disabled?: boolean;
  $size: number;
  // accent colour for the border and checkmark when checked (defaults to "info")
  $color: FlatThemeColor;
  // when true the checked box stays a plain (white) box and the checkmark is
  // painted in $color; when false (default) the box is filled with $color and
  // the checkmark is white. Used e.g. by the negated query edge so the check
  // echoes the red edge colour.
  $noFill?: boolean;
}
export const StyledCheckboxIndicator = styled.span<StyledCheckboxIndicator>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border: 2px solid
    ${({ theme, $checked, $color, $disabled }) =>
      $disabled
        ? theme.color["gray"][400]
        : $checked
          ? theme.color[$color]
          : theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $checked, $color, $noFill, $disabled }) =>
    $checked && !$noFill && !$disabled
      ? theme.color[$color]
      : theme.color["white"]};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  /* transition:
    background-color 0.15s ease,
    border-color 0.15s ease; */

  /* the label reads as part of the control, so it shares the box's hover state;
     keyboard focus reuses the same accent border cue */
  &:focus-visible,
  ${StyledCheckbox}:hover & {
    border-color: ${({ theme, $color, $disabled }) =>
      $disabled ? theme.color["gray"][400] : theme.color[$color]};
  }

  &:focus-visible {
    outline: none;
  }

  svg {
    color: ${({ theme, $color, $noFill, $disabled }) =>
      $disabled
        ? theme.color["gray"][500]
        : $noFill
          ? theme.color[$color]
          : theme.color["white"]};
    ${({ $checked }) =>
      $checked &&
      css`
        /* animation: ${checkmarkPop} 0.2s ease-out; */
      `}
  }
`;

export const StyledCheckboxWrapper = styled.span`
  display: flex;
  cursor: pointer;
`;
interface StyledIconOnlyCheckbox {
  $checked?: boolean;
}
export const StyledIconOnlyCheckbox = styled.div<StyledIconOnlyCheckbox>`
  width: 1.8rem;
  height: 1.8rem;
  padding: 0.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  border: 1px solid ${({ theme, $checked }) => ($checked ? theme.color["info"] : "transparent")};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  color: ${({ theme, $checked }) => ($checked ? theme.color["info"] : theme.color["gray"][600])};
`;
