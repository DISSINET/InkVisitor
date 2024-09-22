import { useSpring } from "@react-spring/web";
import React, { useEffect, useState } from "react";
import { setDisableUserSelect } from "redux/features/layout/disableUserSelectSlice";
import { useAppDispatch } from "redux/hooks";
import { springConfig } from "Theme/constants";
import { StyledLayoutSeparatorHorizontal } from "./SeparatorStyles";

interface LayoutSeparatorHorizontal {
  topPositionMin: number;
  topPositionMax: number;
  // set custom one related to specific page
  separatorYPosition: number;
  setSeparatorYPosition: (xPosition: number) => void;
}
export const LayoutSeparatorHorizontal: React.FC<LayoutSeparatorHorizontal> = ({
  topPositionMin,
  topPositionMax,
  separatorYPosition,
  setSeparatorYPosition,
}) => {
  const dispatch = useAppDispatch();

  const [separatorXTempPosition, setSeparatorXTempPosition] = useState<
    undefined | number
  >(undefined);
  const [topPosition, setTopPosition] = useState<number>(separatorYPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedHorizontalSeparator = useSpring({
    top: `${(topPosition - 3) / 10}rem`,
    config: springConfig.separatorYPosition,
  });

  useEffect(() => {
    if (topPosition !== separatorYPosition) {
      setTopPosition(separatorYPosition);
    }

    window.getSelection()?.removeAllRanges();
  }, [separatorYPosition]);

  useEffect(() => {
    if (!dragging && topPosition !== separatorYPosition) {
      setSeparatorYPosition(topPosition);
    }
  }, [topPosition, dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientY);
    setDragging(true);
    dispatch(setDisableUserSelect(true));
  };

  const onMove = (clientY: number) => {
    if (dragging && topPosition && separatorXTempPosition) {
      const newtopPosition = topPosition + clientY - separatorXTempPosition;
      setSeparatorXTempPosition(clientY);
      if (newtopPosition < topPositionMin) {
        setTopPosition(topPositionMin);
        return;
      }

      if (newtopPosition > topPositionMax) {
        setTopPosition(topPositionMax);
        return;
      }
      setTopPosition(newtopPosition);
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
    <StyledLayoutSeparatorHorizontal
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={animatedHorizontalSeparator}
      $show={hovered || dragging}
    />
  );
};
