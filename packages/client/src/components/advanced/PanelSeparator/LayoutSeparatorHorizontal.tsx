import { useSpring } from "@react-spring/web";
import React, { useEffect, useState, useCallback } from "react";
import { springConfig } from "Theme/constants";
import { StyledLayoutSeparatorHorizontal } from "./SeparatorStyles";

interface LayoutSeparatorHorizontal {
  topPositionMin: number;
  topPositionMax: number;
  // set custom one related to specific page
  separatorYPosition: number;
  setSeparatorYPosition: (yPosition: number) => void;
  width?: number;
  left?: number;
  onMaxHeightReached?: () => void;
  onMinHeightReached?: () => void;
}
export const LayoutSeparatorHorizontal: React.FC<LayoutSeparatorHorizontal> = ({
  topPositionMin,
  topPositionMax,
  separatorYPosition,
  setSeparatorYPosition,
  width,
  left,
  onMaxHeightReached,
  onMinHeightReached,
}) => {
  const [separatorYTempPosition, setSeparatorYTempPosition] = useState<
    number | undefined
  >(undefined);
  const [topPosition, setTopPosition] = useState<number>(separatorYPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedHorizontalSeparator = useSpring({
    top: `${(topPosition - 3) / 10}rem`,
    ...(width !== undefined && { width: `${width / 10}rem` }),
    ...(left !== undefined && { left: `${left / 10}rem` }),
    config: springConfig.separatorYPosition,
  });

  useEffect(() => {
    if (topPosition !== separatorYPosition && !dragging) {
      setTopPosition(separatorYPosition);
    }
    window.getSelection()?.removeAllRanges();
  }, [separatorYPosition, dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    document.body.classList.add("no-select");
    setSeparatorYTempPosition(e.clientY);
    setDragging(true);
  };

  const onMove = useCallback(
    (clientY: number) => {
      if (dragging && topPosition && separatorYTempPosition) {
        const newTopPosition = topPosition + clientY - separatorYTempPosition;

        setSeparatorYTempPosition(clientY);

        // Clamp the new position between min and max
        const clampedPosition = Math.min(
          Math.max(newTopPosition, topPositionMin),
          topPositionMax
        );
        setTopPosition(clampedPosition);

        // Notify parent when max height is reached
        if (clampedPosition === topPositionMax && onMaxHeightReached) {
          onMaxHeightReached();
        }
        // Notify parent when min height is reached
        if (clampedPosition === topPositionMin && onMinHeightReached) {
          onMinHeightReached();
        }
      }
    },
    [
      dragging,
      topPosition,
      separatorYTempPosition,
      topPositionMin,
      topPositionMax,
      onMaxHeightReached,
      onMinHeightReached,
    ]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      onMove(e.clientY);
    },
    [onMove]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
    document.body.classList.remove("no-select");
    // Apply the final position
    if (topPosition !== separatorYPosition) {
      setSeparatorYPosition(topPosition);
    }
  }, [topPosition, separatorYPosition, setSeparatorYPosition]);

  useEffect(() => {
    if (hovered || dragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      return () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [hovered, dragging, onMouseMove, onMouseUp]);

  return (
    <StyledLayoutSeparatorHorizontal
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={animatedHorizontalSeparator}
      $show={hovered || dragging}
    />
  );
};
