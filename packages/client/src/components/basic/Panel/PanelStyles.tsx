import styled from "styled-components";
import { panelWidthVar } from "utils/layoutUtils";

interface StyledPanel {
  $widthVarIndex?: number;
}
export const StyledPanel = styled.div<StyledPanel>`
  display: flex;
  flex-direction: column;
  height: 100%;
  /* The shared variable carries every frame of both a drag and a spring, so
     nothing is eased here; --panel-width is the width the panel rendered with. */
  width: ${({ $widthVarIndex }) =>
    $widthVarIndex !== undefined
      ? `var(${panelWidthVar($widthVarIndex)}, var(--panel-width))`
      : "var(--panel-width)"};
`;
