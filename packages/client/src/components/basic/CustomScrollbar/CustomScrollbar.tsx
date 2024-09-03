import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  contentWidth?: number;

  children: React.ReactNode;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  contentWidth,
  children,
}) => {
  return (
    <StyledScrollbar
      disableTracksWidthCompensation={false}
      removeTrackXWhenNotUsed={true}
      removeTrackYWhenNotUsed={true}
      permanentTracks={false}
      style={{ width: contentWidth }}
    >
      {children}
    </StyledScrollbar>
  );
};
