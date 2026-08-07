import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../../constants";
import styled from "styled-components";
import {
  StyledControl,
  StyledSearchInput,
  StyledSingleValue,
} from "components/basic/BaseDropdown/BaseDropdownStyles";

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
  position: relative;
  border-radius: 25px;
  height: ${({ theme }) => theme.space[18]};
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[7]}`};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};

  ${StyledSearchInput} {
    color: ${({ theme }) => theme.color.white};
  }
`;

// per-node EQ / SUB expansion checkboxes: a small pill straddling the node's
// bottom border. The page background behind the row keeps the border line from
// striking through the checkbox labels.
export const StyledNodeExpansionToggles = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.space["-3"]};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: 0 ${({ theme }) => theme.space[1]};
  background-color: ${({ theme }) => theme.color.pageBg};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  white-space: nowrap;

  label {
    font-size: ${({ theme }) => theme.fontSize["xxs"]};
    font-weight: ${({ theme }) => theme.fontWeight["normal"]};
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledNodeTypeSelect = styled.div`
  ${StyledControl} {
    background-color: transparent;
    border: none;
    text-align: center;
  }
  ${StyledSingleValue} {
    color: ${({ theme }) => theme.color.primary};
    font-weight: 900;
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
  gap: 0.5rem;
  background-color: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  padding: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[3]};
  margin-top: 1.4rem;
`;

export const StyledTooltipList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.space[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  list-style-type: disc;
`;

export const StyledTooltipListItem = styled.li`
  b {
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  }
`;
