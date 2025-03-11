import Scrollbar from "react-scrollbars-custom";
import styled from "styled-components";

export const StyledScrollbar = styled(Scrollbar)`
  display: flex;
  flex-shrink: 0;
  .ScrollbarsCustom-Wrapper {
    .ScrollbarsCustom-Scroller {
    }
  }
  .ScrollbarsCustom-Track {
    background: transparent !important;

    .ScrollbarsCustom-Thumb {
      width: 80% !important;
      margin-left: 0.1rem !important;
    }
  }
`;
