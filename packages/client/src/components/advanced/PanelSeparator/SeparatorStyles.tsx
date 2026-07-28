import styled from "styled-components";
import {
  boxHeightVar,
  panelLeftEdgeValue,
  panelWidthVar,
  separatorPositionVar,
} from "utils/layoutUtils";

interface StyledPanelSeparator {
  $show: boolean;
}
export const StyledPanelSeparator = styled.div<StyledPanelSeparator>`
  position: absolute;
  background-color: ${({ theme }) => theme.color["success"]};
  background-color: ${({ $show, theme }) =>
    $show ? theme.color["success"] : theme.color["gray"][500]};
  z-index: 30;

  opacity: ${({ $show }) => ($show ? 1 : 0.4)};
  transition: opacity 0.3s ease;
`;

interface StyledLayoutSeparatorVertical {
  $positionVarKey?: string;
}
export const StyledLayoutSeparatorVertical = styled(
  StyledPanelSeparator,
)<StyledLayoutSeparatorVertical>`
  width: ${({ $show, theme }) =>
    $show ? theme.borderWidth[4] : theme.borderWidth[2]};
  height: ${({ theme }) => `calc(100% - ${theme.borderWidth[2]})`};
  cursor: col-resize;
  /* a pointer drag on a touch screen scrolls the page instead of dragging */
  touch-action: none;
  /* The position variable carries every frame of both a drag and a spring, so
     nothing is eased here. Half the line's width comes off so that it straddles
     the panel edge it sits on. */
  left: calc(
    ${({ $positionVarKey }) =>
        $positionVarKey !== undefined
          ? `var(${separatorPositionVar($positionVarKey)}, var(--separator-x))`
          : "var(--separator-x)"} - 0.1rem
  );
`;
interface StyledLayoutSeparatorHorizontal {
  $panelIndex?: number;
  $boxHeightVarKey?: string;
}
export const StyledLayoutSeparatorHorizontal = styled(
  StyledPanelSeparator,
)<StyledLayoutSeparatorHorizontal>`
  height: ${({ $show, theme }) =>
    $show ? theme.borderWidth[4] : theme.borderWidth[2]};
  cursor: row-resize;
  /* a pointer drag on a touch screen scrolls the page instead of dragging */
  touch-action: none;
  /* Every edge comes from the variables of what it borders - the panel it spans
     and the box it sits under - so the separator travels with them, spring and
     all. Half the line's height comes off so that it straddles the box edge. */
  width: ${({ $panelIndex, theme }) =>
    $panelIndex !== undefined
      ? `var(${panelWidthVar($panelIndex)})`
      : `calc(100% - ${theme.borderWidth[2]})`};
  left: ${({ $panelIndex }) =>
    $panelIndex !== undefined ? panelLeftEdgeValue($panelIndex) : "0"};
  top: calc(
    ${({ $boxHeightVarKey }) =>
        $boxHeightVarKey !== undefined
          ? `var(${boxHeightVar($boxHeightVarKey)}, var(--separator-y))`
          : "var(--separator-y)"} - 0.3rem
  );
`;
