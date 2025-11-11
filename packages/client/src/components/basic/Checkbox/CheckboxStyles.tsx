import styled from "styled-components";

export const StyledCheckbox = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  display: flex;
  align-items: center;
`;
export const StyledCheckboxWrapper = styled.span`
  display: flex;
  cursor: pointer;
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
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? theme.color["info"] : "transparent")};
  background-color: ${({ theme, $checked }) =>
    $checked
      ? `rgba(${theme.color["info"].replace("#", "")}, 0.1)`
      : "transparent"};
  border-radius: 0.2rem;

  color: ${({ theme, $checked }) =>
    $checked ? theme.color["info"] : theme.color["gray"][600]};
`;
