import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { RESIZING_CLASS } from "Theme/constants";
import { StyledLayoutSeparatorHorizontal } from "./SeparatorStyles";

interface LayoutSeparatorHorizontal {
  topPositionMin: number;
  topPositionMax: number;
  // set custom one related to specific page
  separatorYPosition: number;
  setSeparatorYPosition: (yPosition: number) => void;
  // Paints the layout at a position the drag has reached but not committed.
  // Boxes stay where they are during a drag without it.
  applyPreview?: (yPosition: number) => void;
  // Panel the separator spans, sizing it from that panel's width variable.
  // Takes precedence over the width and left props.
  panelIndex?: number;
  width?: number;
  left?: number;
  onMaxHeightReached?: () => void;
  onMinHeightReached?: () => void;
}

const separatorYValue = (yPosition: number) => `${(yPosition - 3) / 10}rem`;

export const LayoutSeparatorHorizontal: React.FC<LayoutSeparatorHorizontal> = ({
  topPositionMin,
  topPositionMax,
  separatorYPosition,
  setSeparatorYPosition,
  applyPreview,
  panelIndex,
  width,
  left,
  onMaxHeightReached,
  onMinHeightReached,
}) => {
  const separatorRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  // The position a drag has reached lives in a ref and is painted straight to
  // the DOM: a pointermove that rendered React could not keep the boxes under
  // the pointer.
  const dragYPosition = useRef<number>(separatorYPosition);
  const lastClientY = useRef<number>(0);
  const frame = useRef<number | null>(null);
  // read by the unmount cleanup, which sees the state as it was at mount
  const draggingRef = useRef(false);

  // The body classes belong to the drag, not to the separator: a box that
  // changes state mid-drag takes this component with it, and a body left marked
  // as resizing suppresses every layout transition for the rest of the session.
  useEffect(
    () => () => {
      if (draggingRef.current) {
        document.body.classList.remove("no-select", RESIZING_CLASS);
      }
    },
    [],
  );

  const paintDragPosition = () => {
    frame.current = null;
    separatorRef.current?.style.setProperty(
      "--separator-y",
      separatorYValue(dragYPosition.current),
    );
    applyPreview?.(dragYPosition.current);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // pointer capture keeps the moves coming while the pointer is off the
    // separator, which is most of a drag
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add("no-select", RESIZING_CLASS);
    dragYPosition.current = separatorYPosition;
    lastClientY.current = e.clientY;
    draggingRef.current = true;
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const requestedYPosition =
      dragYPosition.current + e.clientY - lastClientY.current;
    lastClientY.current = e.clientY;

    // Clamp the new position between min and max
    dragYPosition.current = Math.min(
      Math.max(requestedYPosition, topPositionMin),
      topPositionMax,
    );

    if (frame.current === null) {
      frame.current = window.requestAnimationFrame(paintDragPosition);
    }

    // Notify parent when max height is reached
    if (dragYPosition.current === topPositionMax && onMaxHeightReached) {
      onMaxHeightReached();
    }
    // Notify parent when min height is reached
    if (dragYPosition.current === topPositionMin && onMinHeightReached) {
      onMinHeightReached();
    }
  };

  const endDrag = () => {
    if (!dragging) return;

    if (frame.current !== null) {
      window.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    draggingRef.current = false;
    setDragging(false);
    document.body.classList.remove("no-select", RESIZING_CLASS);
    window.getSelection()?.removeAllRanges();

    // Apply the final position
    if (dragYPosition.current !== separatorYPosition) {
      setSeparatorYPosition(dragYPosition.current);
    }
  };

  return (
    <StyledLayoutSeparatorHorizontal
      ref={separatorRef}
      // a render landing mid-drag would restore the pre-drag position from props
      style={
        {
          "--separator-y": separatorYValue(
            dragging ? dragYPosition.current : separatorYPosition,
          ),
          ...(width !== undefined && {
            "--separator-width": `${width / 10}rem`,
          }),
          ...(left !== undefined && { "--separator-left": `${left / 10}rem` }),
        } as CSSProperties
      }
      $panelIndex={panelIndex}
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
