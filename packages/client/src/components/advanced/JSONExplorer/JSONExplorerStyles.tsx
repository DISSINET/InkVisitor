import styled from "styled-components";

export const StyledJSONExplorerWrapper = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  button {
    margin-bottom: ${({ theme }) => theme.space[3]};
  }
`;
