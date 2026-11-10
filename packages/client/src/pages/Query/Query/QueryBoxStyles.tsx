import styled from "styled-components";
import { INodeItem } from "../types";
import { QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../constants";

interface StyledQueryBoxProps {
  $gridWeight: number;
  $nodeItems: INodeItem[];
}

export const StyledQueryBox = styled.div<StyledQueryBoxProps>`
  padding: 1rem;
  padding-top: 0.5rem;
  // the scrolling wrapper is a column flex container, so without this the grid
  // is stretched to the visible width and its columns spill past the padding
  // instead of extending the scrollable area — leaving no trailing room to the
  // right of the last node, and nothing to scroll into
  min-width: max-content;
  // no trailing padding: the node rows overflow their columns, past any padding
  // here, and carry their own trailing room (StyledNodeMainRow)
  padding-bottom: 4rem;
  display: grid;
  grid-template-columns: repeat(
    ${({ $gridWeight }) => $gridWeight + 1},
    ${QUERY_GRID_WIDTH - 10}px
  );
  grid-template-rows: repeat(${({ $nodeItems }) => $nodeItems.length}, ${QUERY_GRID_HEIGHT}px);
`;

interface StyledGridCellProps {
  $column: number;
  $row: number;
  $hasNode: boolean;
}

export const StyledGridCell = styled.div<StyledGridCellProps>`
  position: relative;
  // a node's row (suggester, filters, add and remove buttons) runs past its
  // cell into the next column, whose cells come later and would cover it
  z-index: ${({ $hasNode }) => ($hasNode ? 1 : "auto")};
  grid-column: ${({ $column }) => $column};
  grid-row: ${({ $row }) => $row};
  width: ${QUERY_GRID_WIDTH}px;
  height: ${QUERY_GRID_HEIGHT}px;
`;
