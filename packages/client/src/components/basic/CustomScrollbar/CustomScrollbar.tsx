import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  scrollerId?: string;
  elementId?: string;
  contentWidth?: number;
  contentHeight?: number;
  children: React.ReactNode;
  noScrollX?: boolean;
  noScrollY?: boolean;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  scrollerId,
  elementId,
  contentWidth,
  contentHeight,
  children,
  noScrollX = false,
  noScrollY = false,
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
      disableTracksWidthCompensation={false}
      removeTrackXWhenNotUsed={true}
      removeTrackYWhenNotUsed={true}
      permanentTracks={false}
      style={{
        width: contentWidth ?? "100%",
        height: contentHeight ?? "100%",
      }}
      // noScrollX={contentWidth === undefined || noScrollX}
      // noScrollY={contentHeight === undefined || noScrollY}
    >
      {children}
    </StyledScrollbar>
  );
};
