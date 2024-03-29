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
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
