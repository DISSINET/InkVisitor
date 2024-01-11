import styled from "styled-components";

export const StyledInverseRelationGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  max-width: 100%;
  overflow: hidden;
`;

export const StyledHeading = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: ${({ theme }) => `0 ${theme.space[2]}`};
`;
export const StyledTagWrapper = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
