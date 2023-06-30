import styled from "styled-components";

export const StyledCheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
`;
export const StyledLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-left: ${({ theme }) => theme.space[1]};
`;
