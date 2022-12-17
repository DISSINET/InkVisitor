import styled from "styled-components";

export const StyledSemanticsWrapper = styled.div`
  display: flex;
`;
export const StyledSectionHeading = styled.div`
  margin-right: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
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
  margin-left: ${({ theme }) => theme.space[10]};
  margin-top: ${({ theme }) => theme.space[6]};
  display: flex;
  flex-direction: column;
`;

export const StyledRelationTypeIconWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
