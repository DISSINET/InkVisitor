import styled from "styled-components";

export const StyledLoginText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  color: ${({ theme }) => theme.color["greyer"]};
  margin-bottom: 0.5rem;
`;
export const StyledLoginCitation = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};
  margin-bottom: 0.5rem;
  font-family: monospace;
`;
export const StyledAttrBtnGroupWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;
