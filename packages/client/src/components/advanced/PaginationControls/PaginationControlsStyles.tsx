import styled from "styled-components";

export const StyledPagination = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 12px;
  margin-bottom: 10px;
  color: ${({ theme }) => theme.color.text};
`;
