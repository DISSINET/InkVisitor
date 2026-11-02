import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  scrollerId?: string;
  elementId?: string;
  contentWidth?: number;
  contentHeight?: number;
  customStyle?: React.CSSProperties;

  children: React.ReactNode;
  noScrollX?: boolean;
  noScrollY?: boolean;
  /** sizes the scrollbar to its content; a parent's max-height then caps it */
  autoHeight?: boolean;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  scrollerId,
  elementId,
  contentWidth,
  contentHeight,
  customStyle,
  children,
  noScrollX = false,
  noScrollY = false,
  autoHeight = false,
}) => {
  // Necessary for scrollTo functionality
  if (elementId && scrollerId) {
    const parentDiv = document.getElementById(scrollerId);
    if (parentDiv) {
      const descendantDiv = parentDiv.querySelector(
        ".ScrollbarsCustom-Scroller"
      );
      if (descendantDiv) {
        descendantDiv.id = elementId;
      }
    }
  }

  return (
    <StyledScrollbar
      id={scrollerId}
      $autoHeight={autoHeight}
      disableTracksWidthCompensation={false}
      removeTrackXWhenNotUsed={true}
      removeTrackYWhenNotUsed={true}
      permanentTracks={false}
      translateContentSizeYToHolder={autoHeight}
      style={{
        width: contentWidth ?? "100%",
        height: autoHeight ? undefined : contentHeight ?? "100%",
        ...customStyle,
      }}
      noScrollX={noScrollX}
      noScrollY={noScrollY}
    >
      {children}
    </StyledScrollbar>
  );
};
