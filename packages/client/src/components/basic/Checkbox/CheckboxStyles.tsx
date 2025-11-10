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
