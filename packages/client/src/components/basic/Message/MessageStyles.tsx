import styled from "styled-components";

interface StyledMessage {}
export const StyledMessage = styled.div<StyledMessage>`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["warningText"]};
  background-color: ${({ theme }) => theme.color["warningMessage"]};
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  margin-top: ${({ theme }) => theme.space[1]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  margin-right: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  border: 1.5px solid ${({ theme }) => theme.color["warningBorder"]};
`;

export const StyledMessageTValidationContent = styled.div`
  display: inline;
`;

export const StyledMessageOrigin = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  border-left: 1px solid ${({ theme }) => theme.color["warningBorder"]};
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;
