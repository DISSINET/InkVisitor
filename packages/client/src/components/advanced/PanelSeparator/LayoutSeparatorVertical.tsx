import React, { CSSProperties, useRef, useState } from "react";
import { RESIZING_CLASS } from "Theme/constants";
import { StyledLayoutSeparatorVertical } from "./SeparatorStyles";

interface LayoutSeparatorVertical {
  leftSideMinWidth: number;
  leftSideMaxWidth: number;
  // set custom one related to specific page
  separatorXPosition: number;
  setSeparatorXPosition: (xPosition: number) => void;
  // Paints the layout at a position the drag has reached but not committed.
  // Panels stay where they are during a drag without it.
  applyPreview?: (xPosition: number) => void;
  onMaxWidthReached?: (overflow: number) => void;
  onMinWidthReached?: (overflow: number) => void;
}

const separatorXValue = (xPosition: number) => `${(xPosition - 1) / 10}rem`;

export const LayoutSeparatorVertical: React.FC<LayoutSeparatorVertical> = ({
  leftSideMinWidth,
  leftSideMaxWidth,
  separatorXPosition,
  setSeparatorXPosition,
  applyPreview,
  onMaxWidthReached,
  onMinWidthReached,
}) => {
  const separatorRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // The position a drag has reached lives in a ref and is painted straight to
  // the DOM: a pointermove that rendered React could not keep the panels under
  // the pointer.
  const dragXPosition = useRef<number>(separatorXPosition);
  const lastClientX = useRef<number>(0);
  const frame = useRef<number | null>(null);

  const paintDragPosition = () => {
    frame.current = null;
    separatorRef.current?.style.setProperty(
      "--separator-x",
      separatorXValue(dragXPosition.current),
    );
    applyPreview?.(dragXPosition.current);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // pointer capture keeps the moves coming while the pointer is off the
    // separator, which is most of a drag
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add("no-select", RESIZING_CLASS);
    dragXPosition.current = separatorXPosition;
    lastClientX.current = e.clientX;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const requestedXPosition =
      dragXPosition.current + e.clientX - lastClientX.current;
    lastClientX.current = e.clientX;

    // Clamp the new width between min and max
    dragXPosition.current = Math.min(
      Math.max(requestedXPosition, leftSideMinWidth),
      leftSideMaxWidth,
    );

    if (frame.current === null) {
      frame.current = window.requestAnimationFrame(paintDragPosition);
    }

    // Notify parent with overflow so adjacent panels resize proportionally
    if (requestedXPosition > leftSideMaxWidth && onMaxWidthReached) {
      onMaxWidthReached(requestedXPosition - leftSideMaxWidth);
    } else if (requestedXPosition < leftSideMinWidth && onMinWidthReached) {
      onMinWidthReached(leftSideMinWidth - requestedXPosition);
    }
  };

  const endDrag = () => {
    if (!dragging) return;

    if (frame.current !== null) {
      window.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    setDragging(false);
    document.body.classList.remove("no-select", RESIZING_CLASS);
    window.getSelection()?.removeAllRanges();

    // Apply the final position
    if (dragXPosition.current !== separatorXPosition) {
      setSeparatorXPosition(dragXPosition.current);
    }
  };

  return (
    <StyledLayoutSeparatorVertical
      ref={separatorRef}
      // a render landing mid-drag (a neighbour panel absorbing overflow) would
      // restore the pre-drag position from props
      style={
        {
          "--separator-x": separatorXValue(
            dragging ? dragXPosition.current : separatorXPosition,
          ),
        } as CSSProperties
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onLostPointerCapture={endDrag}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      $show={hovered || dragging}
    />
  );
};
