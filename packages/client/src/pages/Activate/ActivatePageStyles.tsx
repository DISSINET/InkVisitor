import styled from "styled-components";

export const StyledError = styled.p`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.color.danger};
  font-size: ${({ theme }) => theme.fontSize.sm};
  text-align: center;
`;
