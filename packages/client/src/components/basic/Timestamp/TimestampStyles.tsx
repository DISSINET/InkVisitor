import styled from "styled-components";

export const StyledTimestamp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  border: ${({ theme }) => `1px solid ${theme.color.primaryTransparent}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color.invertedBg.primary};
  color: ${({ theme }) => theme.color.primary};
  font-size: ${({ theme }) => theme.fontSize.xs};
  line-height: 1.2;
  white-space: nowrap;
`;

export const StyledTimestampLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;
