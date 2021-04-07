import styled from "styled-components";

export const StyledContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
export const StyledRow = styled.div`
  display: flex;
  align-items: center;
  input,
  select {
    margin: ${({ theme }) => `0 ${theme.space[5]}`};
  }
`;
