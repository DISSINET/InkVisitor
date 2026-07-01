import styled from "styled-components";

export const StyledWarningIcon = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.1rem 0.45rem;
  border-radius: ${({ theme }) => theme.borderRadius.default};
  color: ${({ theme }) => theme.color["warningText"]};
  /* very light tint of the warning color to group icon + code together */
  background-color: ${({ theme }) => theme.color["warningText"]}14;
  border: 1px solid ${({ theme }) => theme.color["warningText"]}33;
  white-space: nowrap;
  cursor: default;
`;

export const StyledWarningCode = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  letter-spacing: 0.02em;
`;
