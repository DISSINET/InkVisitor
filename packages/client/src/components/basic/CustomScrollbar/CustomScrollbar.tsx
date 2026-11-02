import React from "react";
import { StyledScrollbar } from "./CustomScrollbarStyles";

interface CustomScrollbar {
  /** id of the scrolling element, for callers that `scrollTo` it */
  id?: string;
  contentWidth?: number;
  /** lets `styled(CustomScrollbar)` add its own rules */
  className?: string;
  children: React.ReactNode;
}
export const CustomScrollbar: React.FC<CustomScrollbar> = ({
  id,
  contentWidth,
  className,
  children,
}) => {
  return (
    <StyledScrollbar id={id} $width={contentWidth} className={className}>
      {children}
    </StyledScrollbar>
  );
};
