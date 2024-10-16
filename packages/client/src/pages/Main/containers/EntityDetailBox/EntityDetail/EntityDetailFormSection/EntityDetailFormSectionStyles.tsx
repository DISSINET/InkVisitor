import styled from "styled-components";

export const StyledAlternativeLabels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
export const StyledAlternativeLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["black"]};
  padding: 0.2rem 0.5rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
