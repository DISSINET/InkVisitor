import React, { useEffect, useState } from "react";
import { useSpring } from "react-spring";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import {
  secondPanelMinWidth,
  springConfig,
  thirdPanelMinWidth,
} from "Theme/constants";
import { debounce } from "utils";

import { StyledPanelSeparator } from "./PanelSeparatorStyles";

interface PanelSeparator {}
export const PanelSeparator: React.FC<PanelSeparator> = ({}) => {
  const dispatch = useAppDispatch();
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const layoutWidth: number = useAppSelector(
    (state) => state.layout.layoutWidth
  );
  const separatorXPosition: number = useAppSelector(
    (state) => state.layout.separatorXPosition
  );

  const LEFT_SIDE_MIN_WIDTH = secondPanelMinWidth + panelWidths[0];
  const LEFT_SIDE_MAX_WIDTH = layoutWidth - panelWidths[3] - thirdPanelMinWidth;

  const [separatorInitialized, setseparatorInitialized] = useState(false);
  const [separatorXTempPosition, setSeparatorXTempPosition] = useState<
    undefined | number
  >(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(separatorXPosition);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const animatedSeparator = useSpring({
    left: `${(leftWidth - 2) / 10}rem`,
    config: springConfig.separatorXPosition,
  });

  useEffect(() => {
    if (!separatorInitialized) {
      setLeftWidth(separatorXPosition);
      setseparatorInitialized(true);
    }
    dispatch(
      setPanelWidths([
        panelWidths[0],
        separatorXPosition - panelWidths[0],
        panelWidths[0] + panelWidths[1] + panelWidths[2] - separatorXPosition,
        panelWidths[3],
      ])
    );
  }, [separatorXPosition, separatorInitialized]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientX);
    setDragging(true);
  };

  const onMove = (clientX: number) => {
    if (dragging && leftWidth && separatorXTempPosition) {
      const newLeftWidth = leftWidth + clientX - separatorXTempPosition;
      setSeparatorXTempPosition(clientX);
      if (newLeftWidth < LEFT_SIDE_MIN_WIDTH) {
        setLeftWidth(LEFT_SIDE_MIN_WIDTH);
        return;
      }

      if (newLeftWidth > LEFT_SIDE_MAX_WIDTH) {
        setLeftWidth(LEFT_SIDE_MAX_WIDTH);
        return;
      }
      setLeftWidth(newLeftWidth);
    }
  };

  useEffect(() => {
    if (!dragging) {
      dispatch(setSeparatorXPosition(leftWidth));
    }
  }, [leftWidth, dragging]);

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    onMove(e.clientX);
  };

  const onMouseUp = () => {
    setDragging(false);
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
    <StyledPanelSeparator
      onMouseDown={onMouseDown}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={animatedSeparator}
      $show={hovered || dragging}
    />
  );
};
