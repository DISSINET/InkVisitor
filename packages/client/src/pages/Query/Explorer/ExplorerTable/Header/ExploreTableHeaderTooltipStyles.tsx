import styled from "styled-components";

export const StyledTooltipRow = styled.div<{ $spacer?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: ${({ theme, $spacer }) => ($spacer ? theme.space[2] : 0)};
  padding-top: ${({ theme, $spacer }) => ($spacer ? theme.space[2] : 0)};
  border-top: ${({ theme, $spacer }) =>
    $spacer ? `1px solid ${theme.color["gray"][400]}` : "none"};

  &:not(:first-child) {
    margin-top: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledTooltipLabel = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.9;
`;

export const StyledTooltipValue = styled.span<{ $muted?: boolean }>`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: ${({ $muted }) => ($muted ? 0.85 : 1)};
  line-height: 1.3;
`;
