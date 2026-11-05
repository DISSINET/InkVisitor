import styled from "styled-components";
import { Handle } from "reactflow";

export const StyledRelation = styled.div`
  display: inline-flex;
  overflow: hidden;
  flex-wrap: wrap;
`;
export const StyledEntityWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  margin-right: ${({ theme }) => theme.space[1]};
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
export const StyledCloudEntityWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
  margin: ${({ theme }) => theme.space[1]};
`;
interface StyledGrid {
  $hasAttribute?: boolean;
  $hasOrder: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;
  grid-template-columns: ${({ $hasAttribute, $hasOrder }) =>
    `${$hasOrder ? "2rem" : ""} ${
      $hasAttribute ? "minmax(7rem, auto)" : "auto"
    } ${$hasAttribute ? "10.5rem" : ""}`};
  max-width: 100%;
  align-items: center;
  width: fit-content;
`;
export const StyledGridColumn = styled.div`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
  align-items: center;
`;
export const StyledLabelSuggester = styled.div`
  display: flex;
  flex-direction: column;
`;
interface StyledRelationValues {
  $hasSuggester: boolean;
}
export const StyledRelationValues = styled.div<StyledRelationValues>`
  margin-top: ${({ theme, $hasSuggester }) =>
    $hasSuggester ? theme.space[2] : theme.space[1]};
`;
export const StyledSuggesterWrapper = styled.div`
  margin-top: ${({ theme }) => theme.space[1]};
`;

export const StyledRelationBlock = styled.div``;

interface StyledEntityDetailRelationGraph {
  height?: number;
}

export const StyledEntityDetailRelationGraph = styled.div<StyledEntityDetailRelationGraph>`
  display: block;
  position: relative;
  height: ${({ theme, height }) => (height ? `${height}px` : "500px")};
  margin-top: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[12]};
  margin-bottom: ${({ theme }) => -theme.space[8]};
  /* clips the canvas and the resize handle to the rounded corners */
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  background-color: ${({ theme }) => theme.color["white"]};

  /* reactflow sets the zoom buttons apart with a dark shadow and paints them
     light, neither of which reads on the dark canvas */
  .react-flow__controls {
    box-shadow: none;
    overflow: hidden;
    border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][300]};
    border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  }
  .react-flow__controls-button {
    background-color: ${({ theme }) => theme.color["white"]};
    border-bottom-color: ${({ theme }) => theme.color["gray"][300]};
    fill: ${({ theme }) => theme.color["black"]};
    &:hover {
      background-color: ${({ theme }) => theme.color["gray"][200]};
    }
    &:last-child {
      border-bottom: none;
    }
  }

  /* reactflow gives the attribution link a light backdrop in both themes */
  .react-flow__attribution {
    background-color: transparent;
    a {
      color: ${({ theme }) => theme.color["gray"][500]};
    }
  }
`;

// a handle only for edges between two nodes in one column
export const StyledGraphVerticalHandle = styled(Handle)`
  opacity: 0;
`;

export const StyledGraphResizeHandle = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${({ theme }) => theme.space[2]};
  z-index: 5;
  cursor: row-resize;
  /* a pointer drag on a touch screen scrolls the page instead of resizing */
  touch-action: none;
  /* the graph's own bottom border marks the edge at rest */
  border-bottom-width: ${({ theme }) => theme.borderWidth[2]};
  border-bottom-style: solid;
  border-bottom-color: transparent;
  transition: border-color 0.3s ease;
  &:hover,
  &:active {
    border-bottom-color: ${({ theme }) => theme.color["success"]};
  }
`;
