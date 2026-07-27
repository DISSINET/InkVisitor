import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { StyledLayoutSeparatorVertical } from "./SeparatorStyles";

interface LayoutSeparatorVertical {
  // set custom one related to specific page
  separatorXPosition: number;
  // Resolves a position the pointer asks for into the one the layout allows,
  // painting whatever else the drag moves. Runs per pointer event, so it must
  // stay clear of React state.
  resolveDrag: (requestedXPosition: number) => number;
  // Commits the position the drag ended on.
  setSeparatorXPosition: (xPosition: number) => void;
  onDragStart?: () => void;
  // Key of the shared position variable the layout writes this separator to,
  // for pages where dragging one separator can push another.
  positionVarKey?: string;
}

const separatorXValue = (xPosition: number) => `${xPosition / 10}rem`;

export const LayoutSeparatorVertical: React.FC<LayoutSeparatorVertical> = ({
  separatorXPosition,
  resolveDrag,
  setSeparatorXPosition,
  onDragStart,
  positionVarKey,
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
  // read by the unmount cleanup, which sees the state as it was at mount
  const draggingRef = useRef(false);

  // The body classes belong to the drag, not to the separator: a panel that
  // collapses mid-drag takes this component with it, and a body left marked
  // as resizing suppresses every layout transition for the rest of the session.
  useEffect(
    () => () => {
      if (draggingRef.current) {
        document.body.classList.remove("no-select");
      }
    },
    [],
  );

  const paintDragPosition = () => {
    frame.current = null;
    separatorRef.current?.style.setProperty(
      "--separator-x",
      separatorXValue(dragXPosition.current),
    );
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // pointer capture keeps the moves coming while the pointer is off the
    // separator, which is most of a drag
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.classList.add("no-select");
    dragXPosition.current = separatorXPosition;
    lastClientX.current = e.clientX;
    draggingRef.current = true;
    setDragging(true);
    onDragStart?.();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    // The pointer asks for a position; the layout decides which one it gets,
    // and the difference is discarded rather than accumulated - dragging well
    // past a limit and back must not leave the separator owing motion.
    const requestedXPosition =
      dragXPosition.current + e.clientX - lastClientX.current;
    lastClientX.current = e.clientX;

    dragXPosition.current = resolveDrag(requestedXPosition);

    if (frame.current === null) {
      frame.current = window.requestAnimationFrame(paintDragPosition);
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
    document.body.classList.remove("no-select");
    window.getSelection()?.removeAllRanges();

    // Unconditional: a drag that leaves this separator on its own bound can
    // still have pushed the others, and only the caller resolving the whole
    // layout can see that. It discards a drag that moved nothing.
    setSeparatorXPosition(dragXPosition.current);
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
      $positionVarKey={positionVarKey}
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
