import React, { useEffect, useState } from "react";
import { useSpring } from "react-spring";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";

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

  const [separatorXPosition, setSeparatorXPosition] = useState<
    undefined | number
  >(undefined);
  const [leftWidth, setLeftWidth] = useState<number>(144 + 432);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const MIN_WIDTH = 50;

  const animatedXPosition = useSpring({
    left: `${(leftWidth - 2) / 10}rem`,
  });

  // useEffect(() => {
  //   setLeftWidth(panelWidths[0] + panelWidths[1]);
  // }, [panelWidths]);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXPosition(e.clientX);
    setDragging(true);
  };

  const onMove = (clientX: number) => {
    // if (dragging && leftWidth && separatorXPosition) {
    //   const newLeftWidth = leftWidth + clientX - separatorXPosition;
    //   setSeparatorXPosition(clientX);

    //   if (newLeftWidth < MIN_WIDTH) {
    //     setLeftWidth(MIN_WIDTH);
    //     return;
    //   }

    //   const splitPaneWidth = panelWidths[1] + panelWidths[2];

    //   if (newLeftWidth > splitPaneWidth - MIN_WIDTH) {
    //     setLeftWidth(splitPaneWidth - MIN_WIDTH);
    //     return;
    //   }

    //   setLeftWidth(newLeftWidth);
    // }
    if (dragging && leftWidth && separatorXPosition) {
      const newLeftWidth = leftWidth + clientX - separatorXPosition;
      setSeparatorXPosition(clientX);
      setLeftWidth(newLeftWidth);
    }
  };

  useEffect(() => {
    if (!dragging) {
      dispatch(
        setPanelWidths([
          panelWidths[0],
          leftWidth - panelWidths[0],
          panelWidths[0] + panelWidths[1] + panelWidths[2] - leftWidth,
          panelWidths[3],
        ])
      );
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
      // $xPosition={leftWidth}
      style={animatedXPosition}
    />
  );
};
