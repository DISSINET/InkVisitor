import { useSpring } from "@react-spring/web";
import React, { useEffect, useState, useCallback } from "react";
import { springConfig } from "Theme/constants";
import { StyledLayoutSeparatorVertical } from "./SeparatorStyles";

interface LayoutSeparatorVertical {
  leftSideMinWidth: number;
  leftSideMaxWidth: number;
  // set custom one related to specific page
  separatorXPosition: number;
  setSeparatorXPosition: (xPosition: number) => void;
  onMaxWidthReached?: () => void;
}
export const LayoutSeparatorVertical: React.FC<LayoutSeparatorVertical> = ({
  leftSideMinWidth,
  leftSideMaxWidth,
  separatorXPosition,
  setSeparatorXPosition,
  onMaxWidthReached,
}) => {
  const [separatorXTempPosition, setSeparatorXTempPosition] = useState<
    number | undefined
  >(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(separatorXPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedVerticalSeparator = useSpring({
    left: `${(leftWidth - 1) / 10}rem`,
    config: springConfig.separatorXPosition,
  });

  useEffect(() => {
    if (leftWidth !== separatorXPosition && !dragging) {
      setLeftWidth(separatorXPosition);
    }
    window.getSelection()?.removeAllRanges();
  }, [separatorXPosition, dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientX);
    setDragging(true);
    document.body.classList.add("no-select");
  };

  const onMove = useCallback(
    (clientX: number) => {
      if (dragging && leftWidth && separatorXTempPosition) {
        const newLeftWidth = leftWidth + clientX - separatorXTempPosition;
        setSeparatorXTempPosition(clientX);

        // Clamp the new width between min and max
        const clampedWidth = Math.min(
          Math.max(newLeftWidth, leftSideMinWidth),
          leftSideMaxWidth
        );
        setLeftWidth(clampedWidth);

        // Notify parent when max width is reached
        if (clampedWidth === leftSideMaxWidth && onMaxWidthReached) {
          onMaxWidthReached();
        }
      }
    },
    [
      dragging,
      leftWidth,
      separatorXTempPosition,
      leftSideMinWidth,
      leftSideMaxWidth,
      onMaxWidthReached,
    ]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      onMove(e.clientX);
    },
    [onMove]
  );

  const onMouseUp = useCallback(() => {
    setDragging(false);
    document.body.classList.remove("no-select");
    // Apply the final position
    if (leftWidth !== separatorXPosition) {
      setSeparatorXPosition(leftWidth);
    }
  }, [leftWidth, separatorXPosition, setSeparatorXPosition]);

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
    <StyledLayoutSeparatorVertical
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={animatedVerticalSeparator}
      $show={hovered || dragging}
    />
  );
};
