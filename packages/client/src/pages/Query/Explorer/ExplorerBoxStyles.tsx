import styled from "styled-components";

/** The box's content: control bar, then the table or stats filling the rest. */
export const StyledExplorerColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

/** Holds the active view - table or stats - filling what the control bar leaves. */
export const StyledExplorerViewArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;
