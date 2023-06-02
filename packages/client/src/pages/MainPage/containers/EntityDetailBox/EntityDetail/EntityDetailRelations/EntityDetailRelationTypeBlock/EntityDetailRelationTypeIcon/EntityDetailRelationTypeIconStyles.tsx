import styled from "styled-components";

export const StyledRelationType = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: left;

  > * {
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;
