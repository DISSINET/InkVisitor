import { useSpring } from "@react-spring/web";
import React, { useEffect, useState } from "react";
import { setDisableUserSelect } from "redux/features/layout/disableUserSelectSlice";
import { useAppDispatch } from "redux/hooks";
import { springConfig } from "Theme/constants";
import { StyledLayoutSeparatorVertical } from "./SeparatorStyles";

interface LayoutSeparatorVertical {
  leftSideMinWidth: number;
  leftSideMaxWidth: number;
  // set custom one related to specific page
  separatorXPosition: number;
  setSeparatorXPosition: (xPosition: number) => void;
}
export const LayoutSeparatorVertical: React.FC<LayoutSeparatorVertical> = ({
  leftSideMinWidth,
  leftSideMaxWidth,
  separatorXPosition,
  setSeparatorXPosition,
}) => {
  const dispatch = useAppDispatch();

  const [separatorXTempPosition, setSeparatorXTempPosition] = useState<
    undefined | number
  >(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(separatorXPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedVerticalSeparator = useSpring({
    left: `${(leftWidth - 1) / 10}rem`,
    config: springConfig.separatorXPosition,
  });

  useEffect(() => {
    if (leftWidth !== separatorXPosition) {
      setLeftWidth(separatorXPosition);
    }

    window.getSelection()?.removeAllRanges();
  }, [separatorXPosition]);

  useEffect(() => {
    if (!dragging && leftWidth !== separatorXPosition) {
      setSeparatorXPosition(leftWidth);
    }
  }, [leftWidth, dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientX);
    setDragging(true);
    dispatch(setDisableUserSelect(true));
  };

  const onMove = (clientX: number) => {
    if (dragging && leftWidth && separatorXTempPosition) {
      const newLeftWidth = leftWidth + clientX - separatorXTempPosition;
      setSeparatorXTempPosition(clientX);
      if (newLeftWidth < leftSideMinWidth) {
        setLeftWidth(leftSideMinWidth);
        return;
      }

      if (newLeftWidth > leftSideMaxWidth) {
        setLeftWidth(leftSideMaxWidth);
        return;
      }
      setLeftWidth(newLeftWidth);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    onMove(e.clientX);
  };

  const onMouseUp = () => {
    setDragging(false);
    dispatch(setDisableUserSelect(false));
  };

  useEffect(() => {
    if (hovered || dragging) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);

      return () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, [hovered, dragging]);

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
