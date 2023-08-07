import styled from "styled-components";

export const StyledRelationType = styled.div`
  display: flex;
  flex-direction: row;

  > * {
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;
