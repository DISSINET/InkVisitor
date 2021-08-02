import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledRowHeader = styled.div`
  display: flex;
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledRowContent = styled.div`
  display: flex;
`;
export const StyledResults = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledResultHeading = styled.h6``;
export const StyledResultItem = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
