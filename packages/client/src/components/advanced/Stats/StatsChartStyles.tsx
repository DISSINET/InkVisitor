import styled from "styled-components";

export const StyledChartWrapper = styled.div`
  &:focus,
  &:focus-visible,
  *:focus,
  *:focus-visible {
    outline: none;
  }
`;

export const StyledEmptyState = styled.div<{ $width: number; $height: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  color: ${({ theme }) => theme.color.gray[500]};
  font-size: ${({ theme }) => theme.fontSize.base};
`;

export const StyledCustomTooltip = styled.div`
  visibility: visible;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color.statsTooltipBackground};
  padding: ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  width: 100%;
  opacity: 0.85;
`;

export const StyledLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.statsTooltipTextColor};
  width: fit-content;
  background-color: ${({ theme }) => theme.color.statsTooltipLabelBackground};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const StyledPayload = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[1]};
`;

export const StyledPayloadItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

// LEGEND
export const StyledLegendWrapper = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: row;
  column-gap: ${({ theme }) => theme.space[1]};
  row-gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
  z-index: 2;
  margin-left: 5rem;
`;

export const StyledLegendItem = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  padding: ${({ theme }) => theme.space[0]} ${({ theme }) => theme.space[5]};
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledLegendColorBox = styled.div<{ $color?: string }>`
  background-color: ${({ $color }) => $color};
  width: ${({ theme }) => theme.space[6]};
  height: ${({ theme }) => theme.space[6]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-sm"]};
  flex-shrink: 0;
`;

export const StyledPayloadColorBox = styled.span<{ $color?: string }>`
  background-color: ${({ $color }) => $color};
  width: ${({ theme }) => theme.space[6]};
  height: ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-sm"]};
  flex-shrink: 0;
`;

export const StyledLegendText = styled.span<{ $color?: string }>`
  font-size: ${({ theme }) => theme.fontSize.base};
  color: ${({ $color }) => $color};
`;
