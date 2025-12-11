import styled from "styled-components";
import { INodeItem, QUERY_GRID_HEIGHT, QUERY_GRID_WIDTH } from "../types";

interface StyledQueryBoxProps {
  gridWeight: number;
  nodeItems: INodeItem[];
}

export const StyledQueryBox = styled.div<StyledQueryBoxProps>`
  padding: 1rem;
  padding-top: 0.5rem;
  display: grid;
  grid-template-columns: repeat(
    ${({ gridWeight }) => gridWeight + 1},
    ${QUERY_GRID_WIDTH}px
  );
  grid-template-rows: repeat(
    ${({ nodeItems }) => nodeItems.length},
    ${QUERY_GRID_HEIGHT}px
  );
`;
