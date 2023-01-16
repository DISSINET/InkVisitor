import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.color["white"]};
  overflow: auto;
`;
export const StyledRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space["32"]} auto;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledRowHeader = styled.div`
  display: block;
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  text-align: right;
`;
export const StyledRowContent = styled.div`
  display: flex;
`;
export const StyledResultsWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  overflow-y: hidden;
  position: relative;
`;
export const StyledResultsHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.regular};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledResultHeading = styled.h6`
  width: 100%;
`;
export const StyledResultItem = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledTagLoaderWrap = styled.div`
  min-height: 3rem;
`;
