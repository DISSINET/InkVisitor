import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  padding-right: 2rem;
`;
export const StyledFlexList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  /* flex-grow: 1; */
`;
export const StyledLabel = styled.div`
  display: grid;
  align-items: center;
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  text-align: end;
  align-items: baseline;
`;
export const StyledValue = styled.div`
  display: grid;
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
