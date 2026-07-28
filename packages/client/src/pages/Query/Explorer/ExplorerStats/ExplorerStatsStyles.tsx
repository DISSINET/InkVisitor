import styled from "styled-components";

export const StyledStatsLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]};
  height: 100%;
  overflow: auto;
`;

export const StyledStatsHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StyledEmptyMessage = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.space[6]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color.plain};
`;

export const StyledConfigStrip = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[6]};
`;

export const StyledField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

// Used by the parked time filter in ExplorerStats.tsx (re-enable later).
export const StyledDateInputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledFieldLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color.black};
`;

export const StyledChartWrapper = styled.div`
  width: 100%;
  height: 22rem;
  min-height: 16rem;
`;

export const StyledTableWrapper = styled.div`
  width: 100%;
  height: 18rem;
`;
