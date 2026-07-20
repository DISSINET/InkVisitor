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
  padding-right: 6rem;
  padding-bottom: 4rem;
  display: grid;
  grid-template-columns: repeat(
    ${({ $gridWeight }) => $gridWeight + 1},
    ${QUERY_GRID_WIDTH - 10}px
  );
  grid-template-rows: repeat(${({ $nodeItems }) => $nodeItems.length}, ${QUERY_GRID_HEIGHT}px);
`;
