import React, { useEffect, useState } from "react";
import { useSpring } from "react-spring";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { setSeparatorXPosition } from "redux/features/layout/separatorXPositionSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { springConfig } from "Theme/constants";
import theme from "Theme/theme";

import { StyledPanelSeparator } from "./PanelSeparatorStyles";

const MIN_WIDTH = 300;
interface PanelSeparator {}
export const PanelSeparator: React.FC<PanelSeparator> = ({}) => {
  const dispatch = useAppDispatch();
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const separatorXPosition: number = useAppSelector(
    (state) => state.layout.separatorXPosition
  );

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
    // TODO: this is needed only for INIT after width count
    setLeftWidth(separatorXPosition);
    dispatch(
      setPanelWidths([
        panelWidths[0],
        separatorXPosition - panelWidths[0],
        panelWidths[0] + panelWidths[1] + panelWidths[2] - separatorXPosition,
        panelWidths[3],
      ])
    );
  }, [separatorXPosition]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXTempPosition(e.clientX);
    setDragging(true);
  };

  const onMove = (clientX: number) => {
    if (dragging && leftWidth && separatorXTempPosition) {
      const newLeftWidth = leftWidth + clientX - separatorXTempPosition;
      setSeparatorXTempPosition(clientX);
      if (newLeftWidth < MIN_WIDTH + panelWidths[0]) {
        setLeftWidth(MIN_WIDTH + panelWidths[0]);
        return;
      }
      const threePanelWidth = panelWidths[0] + panelWidths[1] + panelWidths[2];

      if (newLeftWidth > threePanelWidth - MIN_WIDTH) {
        setLeftWidth(threePanelWidth - MIN_WIDTH);
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
  }, [hovered]);

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
