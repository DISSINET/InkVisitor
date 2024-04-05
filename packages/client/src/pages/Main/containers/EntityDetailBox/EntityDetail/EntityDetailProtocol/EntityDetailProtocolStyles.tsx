import styled from "styled-components";

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  grid-gap: 1rem;
  padding-right: 2rem;
`;
export const StyledLabel = styled.div`
  display: grid;
  align-items: center;
  text-align: right;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledValue = styled.div`
  display: grid;
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
