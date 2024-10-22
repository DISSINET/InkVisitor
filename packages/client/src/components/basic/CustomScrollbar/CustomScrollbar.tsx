import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  scrollerId?: string;
  elementId?: string;
  contentWidth?: number;

  children: React.ReactNode;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  scrollerId,
  elementId,
  contentWidth,
  children,
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
      style={{ width: contentWidth || "" }}
    >
      {children}
    </StyledScrollbar>
  );
};
