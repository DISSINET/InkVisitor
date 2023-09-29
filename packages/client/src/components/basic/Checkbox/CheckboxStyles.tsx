import styled from "styled-components";
import { space1 } from "Theme/constants";

export const StyledCheckboxWrapper = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  display: flex;
  align-items: center;
`;
interface StyledCheckbox {
  disabled: boolean;
}
export const StyledCheckbox = styled.input<StyledCheckbox>`
  height: ${({ theme }) => theme.space[10]};
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding: ${space1};
  width: ${({ width }) => (width ? `${width}px` : "auto")};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: ${({ theme }) => theme.space[1]};
  user-select: none;
  cursor: pointer;
`;
