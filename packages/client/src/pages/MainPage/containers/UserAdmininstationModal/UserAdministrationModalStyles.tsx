import styled from "styled-components";

export const StyledLogInBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-direction: column;
  width: 100%;
  height: ${({ theme }) => theme.space[28]};
`;
