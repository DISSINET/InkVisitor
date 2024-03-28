import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  padding-right: 2rem;
`;
export const StyledLabel = styled.div`
  display: grid;
  text-align: right;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledFlexList = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
