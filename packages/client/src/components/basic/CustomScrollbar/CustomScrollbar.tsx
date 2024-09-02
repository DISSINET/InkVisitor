import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  width?: number;

  children: React.ReactNode;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  width,
  children,
}) => {
  return (
    <StyledScrollbar
      disableTracksWidthCompensation={false}
      removeTrackXWhenNotUsed={true}
      removeTrackYWhenNotUsed={true}
      permanentTracks={false}
      style={{ width }}
    >
      {children}
    </StyledScrollbar>
  );
};
