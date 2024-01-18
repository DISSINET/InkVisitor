import styled from "styled-components";

export const StyledMail = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 0.3rem;
  margin-bottom: 1rem;
`;
export const StyledDescription = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  margin-bottom: 1rem;
`;
export const StyledInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
export const StyledButtonWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;
