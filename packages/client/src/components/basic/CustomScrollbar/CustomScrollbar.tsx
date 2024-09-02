import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  children: React.ReactNode;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({ children }) => {
  return (
    <StyledScrollbar
      disableTracksWidthCompensation={false}
      removeTrackXWhenNotUsed={true}
      removeTrackYWhenNotUsed={true}
      permanentTracks={false}
    >
      {children}
    </StyledScrollbar>
  );
};
