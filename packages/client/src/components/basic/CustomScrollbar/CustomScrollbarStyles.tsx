import Scrollbar from "react-scrollbars-custom";
import styled from "styled-components";

/** Thumb colors only (Annotator-style grays); track stays transparent — no fixed width/radius. */
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

  .ScrollbarsCustom-ThumbY,
  .ScrollbarsCustom-ThumbX {
    background-color: ${({ theme }) => theme.color.gray[500]} !important;
    transition: background-color 0.5s ease;
  }

  .ScrollbarsCustom-TrackY:hover .ScrollbarsCustom-ThumbY,
  .ScrollbarsCustom-TrackY:active .ScrollbarsCustom-ThumbY,
  .ScrollbarsCustom-TrackX:hover .ScrollbarsCustom-ThumbX,
  .ScrollbarsCustom-TrackX:active .ScrollbarsCustom-ThumbX,
  .ScrollbarsCustom-ThumbY:hover,
  .ScrollbarsCustom-ThumbX:hover {
    background-color: ${({ theme }) => theme.color.gray[700]} !important;
  }
`;
