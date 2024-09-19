import { useSpring } from "@react-spring/web";
import React, { useEffect, useState } from "react";
import { setDisableUserSelect } from "redux/features/layout/disableUserSelectSlice";
import { useAppDispatch } from "redux/hooks";
import { springConfig } from "Theme/constants";
import { StyledPanelSeparatorHorizontal } from "./PanelSeparatorStyles";

interface PanelSeparatorHorizontal {
  leftSideMinWidth: number;
  leftSideMaxWidth: number;
  // set custom one related to specific page
  separatorYPosition: number;
  setSeparatorYPosition: (xPosition: number) => void;
}
export const PanelSeparatorHorizontal: React.FC<PanelSeparatorHorizontal> = ({
  leftSideMinWidth,
  leftSideMaxWidth,
  separatorYPosition,
  setSeparatorYPosition,
}) => {
  const dispatch = useAppDispatch();

  const [separatorXTempPosition, setSeparatorXTempPosition] = useState<
    undefined | number
  >(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(separatorYPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedHorizontalSeparator = useSpring({
    top: `${(leftWidth - 1) / 10}rem`,
    config: springConfig.separatorYPosition,
  });

  useEffect(() => {
    if (leftWidth !== separatorYPosition) {
      setLeftWidth(separatorYPosition);
    }

    window.getSelection()?.removeAllRanges();
  }, [separatorYPosition]);

  useEffect(() => {
    if (!dragging && leftWidth !== separatorYPosition) {
      setSeparatorYPosition(leftWidth);
    }
  }, [leftWidth, dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientY);
    setDragging(true);
    dispatch(setDisableUserSelect(true));
  };

  const onMove = (clientY: number) => {
    if (dragging && leftWidth && separatorXTempPosition) {
      const newLeftWidth = leftWidth + clientY - separatorXTempPosition;
      setSeparatorXTempPosition(clientY);
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
    onMove(e.clientY);
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
    <StyledPanelSeparatorHorizontal
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={animatedHorizontalSeparator}
      $show={hovered || dragging}
    />
  );
};
