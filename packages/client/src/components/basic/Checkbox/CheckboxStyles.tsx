import styled, { css, keyframes } from "styled-components";
import { FlatThemeColor } from "Theme/theme";

const checkmarkPop = keyframes`
  0% { transform: scale(0); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

export const StyledCheckbox = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  display: flex;
  align-items: center;
`;

// declared ahead of the indicator, which selects on it to share its hover state
export const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: 0.2rem;
  user-select: none;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

interface StyledCheckboxIndicator {
  $checked: boolean;
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
    ${({ theme, $checked, $color }) =>
      $checked ? theme.color[$color] : theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $checked, $color, $noFill }) =>
    $checked && !$noFill ? theme.color[$color] : theme.color["white"]};
  cursor: pointer;
  /* transition:
    background-color 0.15s ease,
    border-color 0.15s ease; */

  /* the label reads as part of the control, so it shares the box's hover state */
  &:hover,
  ${StyledCheckbox}:has(${StyledLabel}:hover) & {
    border-color: ${({ theme, $color }) => theme.color[$color]};
  }

  svg {
    color: ${({ theme, $color, $noFill }) =>
      $noFill ? theme.color[$color] : theme.color["white"]};
    ${({ $checked }) =>
      $checked &&
      css`
        /* animation: ${checkmarkPop} 0.2s ease-out; */
      `}
  }
`;

export const StyledCheckboxWrapper = styled.span<{ $hasLabel?: boolean }>`
  display: flex;
  cursor: pointer;
  margin-right: ${({ $hasLabel }) => ($hasLabel ? "0.2rem" : "0")};
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
