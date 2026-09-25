import styled from "styled-components";

export const StyledPreview = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  width: 100%;
`;

export const StyledSummary = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledSectionTitle = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  text-transform: uppercase;
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledTreeNode = styled.div<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding-left: ${({ $depth }) => `${$depth * 2}rem`};
`;

export const StyledEntityBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"]["300"]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const StyledRow = styled.div<{ $depth?: number }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding-left: ${({ $depth = 0 }) => `${$depth * 2}rem`};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledRowLabel = styled.span`
  min-width: ${({ theme }) => theme.space[20]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledMeta = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledNewBadge = styled.span`
  padding: 0 ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["white"]};
  background-color: ${({ theme }) => theme.color["success"]};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
`;

export const StyledRelationLabel = styled.span`
  color: ${({ theme }) => theme.color["greyer"]};
`;
