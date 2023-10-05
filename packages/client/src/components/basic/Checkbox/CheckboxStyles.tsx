import styled from "styled-components";
import { space1 } from "Theme/constants";

export const StyledCheckbox = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  display: flex;
  align-items: center;
`;
export const StyledCheckboxWrapper = styled.span`
  cursor: pointer;
`;
export const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: ${({ theme }) => theme.space[1]};
  user-select: none;
  cursor: pointer;
`;
