import styled, { css, keyframes } from "styled-components";

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

interface StyledCheckboxIndicator {
  $checked: boolean;
  $size: number;
}
export const StyledCheckboxIndicator = styled.span<StyledCheckboxIndicator>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border: 2px solid
    ${({ theme, $checked }) => ($checked ? theme.color["info"] : theme.color["gray"][400])};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $checked }) =>
    $checked ? theme.color["info"] : theme.color["white"]};
  cursor: pointer;
  /* transition:
    background-color 0.15s ease,
    border-color 0.15s ease; */

  &:hover {
    border-color: ${({ theme }) => theme.color["info"]};
  }

  svg {
    color: ${({ theme }) => theme.color["white"]};
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
export const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: 0.2rem;
  user-select: none;
  cursor: pointer;
  display: flex;
  align-items: center;
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
