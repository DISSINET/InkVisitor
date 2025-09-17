import styled from "styled-components";

export const StyledPagination = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.8rem;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.color.text};
`;
