import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../../constants";
import styled from "styled-components";

export const StyledNodeContainer = styled.div<{ $column?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
`;

export const StyledNodeMainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
`;

export const StyledParallelOperator = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  padding-left: ${({ theme }) => theme.space[2]};
`;

export const StyledGraphNode = styled.div`
  border-radius: 25px;
  height: ${({ theme }) => theme.space[18]};
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[7]}`};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};

  .react-select__input-container {
    color: ${({ theme }) => theme.color.white};
  }
`;

export const StyledNodeTypeSelect = styled.div`
  .react-select__control {
    background-color: transparent;
    border: none;
    text-align: center;
  }
  .react-select__single-value {
    color: ${({ theme }) => theme.color.primary};
    font-weight: 900 !important;
    font-size: large;
  }
`;

export const StyledEdgeContainer = styled.div`
  position: relative;
`;

export const StyledEdgeSvg = styled.svg.attrs({
  width: QUERY_GRID_WIDTH,
  height: QUERY_GRID_HEIGHT,
})`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
`;

export const StyledEdgeControlsLayer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  height: 100%;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

export const StyledEdgeBox = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  padding: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[2]};
  margin-top: 10px;
`;
