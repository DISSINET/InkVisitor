import styled from "styled-components";

interface StyledMessage {}
export const StyledMessage = styled.div<StyledMessage>`
  color: ${({ theme }) => theme.color["danger"]};
  background-color: ${({ theme }) => theme.color["warningMessage"]};
  padding: ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  border: 1.5px solid ${({ theme }) => theme.color["warningText"]};
`;
