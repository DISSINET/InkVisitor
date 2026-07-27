import { animated } from "@react-spring/web";
import { PANEL_RESIZE_TRANSITION, RESIZING_CLASS } from "Theme/constants";
import styled from "styled-components";
import {
  panelLeftEdgeValue,
  panelWidthVar,
  separatorPositionVar,
} from "utils/layoutUtils";

interface StyledPanelSeparator {
  $show: boolean;
}
export const StyledPanelSeparator = styled(animated.div)<StyledPanelSeparator>`
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
  /* The position variables are rewritten per animation frame while dragged, so
     easing applies to the positions the separator is handed rather than the
     ones it is dragged to. Half the line's width comes off so that it straddles
     the panel edge it sits on. */
  left: calc(
    ${({ $positionVarKey }) =>
        $positionVarKey !== undefined
          ? `var(${separatorPositionVar($positionVarKey)}, var(--separator-x))`
          : "var(--separator-x)"} - 0.1rem
  );
  transition:
    opacity 0.3s ease,
    left ${PANEL_RESIZE_TRANSITION};

  body.${RESIZING_CLASS} & {
    transition: opacity 0.3s ease;
  }
`;
interface StyledLayoutSeparatorHorizontal {
  $panelIndex?: number;
}
export const StyledLayoutSeparatorHorizontal = styled(
  StyledPanelSeparator,
)<StyledLayoutSeparatorHorizontal>`
  height: ${({ $show, theme }) =>
    $show ? theme.borderWidth[4] : theme.borderWidth[2]};
  cursor: row-resize;
  /* a pointer drag on a touch screen scrolls the page instead of dragging */
  touch-action: none;
  /* spanning a panel off the panel's own variables keeps the separator with it
     through a horizontal drag, which the separator is not part of */
  width: ${({ $panelIndex, theme }) =>
    $panelIndex !== undefined
      ? `var(${panelWidthVar($panelIndex)})`
      : `var(--separator-width, calc(100% - ${theme.borderWidth[2]}))`};
  left: ${({ $panelIndex }) =>
    $panelIndex !== undefined
      ? panelLeftEdgeValue($panelIndex)
      : "var(--separator-left, 0)"};
  top: var(--separator-y);
  transition:
    opacity 0.3s ease,
    top ${PANEL_RESIZE_TRANSITION},
    left ${PANEL_RESIZE_TRANSITION},
    width ${PANEL_RESIZE_TRANSITION};

  body.${RESIZING_CLASS} & {
    transition: opacity 0.3s ease;
  }
`;
