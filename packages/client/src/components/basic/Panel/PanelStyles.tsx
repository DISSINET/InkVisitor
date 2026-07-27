import { PANEL_RESIZE_TRANSITION, RESIZING_CLASS } from "Theme/constants";
import styled from "styled-components";
import { panelWidthVar } from "utils/layoutUtils";

interface StyledPanel {
  $widthVarIndex?: number;
}
export const StyledPanel = styled.div<StyledPanel>`
  display: flex;
  flex-direction: column;
  height: 100%;
  /* the shared variable is rewritten per animation frame while a separator is
     dragged; --panel-width carries the width the panel rendered with */
  width: ${({ $widthVarIndex }) =>
    $widthVarIndex !== undefined
      ? `var(${panelWidthVar($widthVarIndex)}, var(--panel-width))`
      : "var(--panel-width)"};
  transition: width ${PANEL_RESIZE_TRANSITION};

  body.${RESIZING_CLASS} & {
    transition: none;
  }
`;
