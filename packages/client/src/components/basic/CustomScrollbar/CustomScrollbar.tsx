import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  /** id of the scrolling element, for callers that `scrollTo` it */
  id?: string;
  contentWidth?: number;
  contentHeight?: number;
  customStyle?: React.CSSProperties;

  children: React.ReactNode;
  noScrollX?: boolean;
  noScrollY?: boolean;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  id,
  contentWidth,
  contentHeight,
  customStyle,
  children,
  noScrollX = false,
  noScrollY = false,
}) => {
  return (
    <StyledScrollbar
      id={id}
      $width={contentWidth}
      $height={contentHeight}
      $noScrollX={noScrollX}
      $noScrollY={noScrollY}
      style={customStyle}
    >
      {children}
    </StyledScrollbar>
  );
};
