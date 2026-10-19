import styled from "styled-components";

export const StyledSetupNotice = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]};
  border-left: 3px solid ${({ theme }) => theme.color["warning"]};
  background-color: ${({ theme }) => theme.color.invertedBg["warning"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledSetupNoticeIcon = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["warning"]};
`;

export const StyledSetupNoticeText = styled.div`
  flex: 1;
  min-width: 0;
`;
