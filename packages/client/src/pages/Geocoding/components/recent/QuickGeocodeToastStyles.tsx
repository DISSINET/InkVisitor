import styled from "styled-components";

export const StyledQuickToast = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 0;
`;

export const StyledQuickToastHead = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;

export const StyledQuickToastLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledQuickToastMeta = styled.div`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.9;
`;

export const StyledQuickToastAction = styled.button`
  align-self: flex-start;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: inherit;
  text-decoration: underline;
`;
