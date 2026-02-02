import styled from "styled-components";

export const StyledRelationsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
  padding-right: ${({ theme }) => theme.space[8]};
`;
