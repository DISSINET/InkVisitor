import styled from "styled-components";

export const StyledSemanticsWrapper = styled.div`
  display: flex;
`;
export const StyledLabel = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledLabelInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledRelationsWrapper = styled.div`
  margin-left: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[6]};
  display: flex;
  flex-direction: column;
`;
