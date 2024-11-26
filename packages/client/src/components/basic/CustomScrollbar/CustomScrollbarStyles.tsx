import Scrollbar from "react-scrollbars-custom";
import styled from "styled-components";

export const StyledScrollbar = styled(Scrollbar)`
  .ScrollbarsCustom-Wrapper {
    .ScrollbarsCustom-Scroller {
      .ScrollbarsCustom-Content {
        padding-right: 0.1rem !important;
      }
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
