import React, { useEffect, useState } from "react";
import { DragSourceMonitor, useDrag } from "react-dnd";
import { setPanelWidths } from "redux/features/layout/panelWidthsSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { ItemTypes } from "types";
import { StyledPanelSeparator } from "./PanelSeparatorStyles";

interface PanelSeparator {
  xPosition: number;
}
export const PanelSeparator: React.FC<PanelSeparator> = ({ xPosition }) => {
  const dispatch = useAppDispatch();
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );

  const [separatorXPosition, setSeparatorXPosition] = useState<
    undefined | number
  >(undefined);
  const [dragging, setDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    setSeparatorXPosition(e.clientX);
    setDragging(true);
  };

  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    // onMove(e.clientX);
  };

  const onMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <StyledPanelSeparator onMouseDown={onMouseDown} xPosition={xPosition} />
  );
};
