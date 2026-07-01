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
  display: grid;
  grid-template-columns: repeat(
    ${({ $gridWeight }) => $gridWeight + 1},
    ${QUERY_GRID_WIDTH - 10}px
  );
  grid-template-rows: repeat(${({ $nodeItems }) => $nodeItems.length}, ${QUERY_GRID_HEIGHT}px);
`;
