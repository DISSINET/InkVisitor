import { useEffect, useRef, useState } from "react";
import React from "react";
import { CanvasLib, example, Mode } from "@inkvisitor/canvas/src/lib";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./CanvasStyles";
import { Button } from "components/basic/Button/Button";
import { useCanvas } from "./CanvasContext";

export const Canvas = () => {
  const {canvas, setCanvas } = useCanvas();

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setHighlighted] = useState("");

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const customCanvasWrapper = new CanvasLib(mainCanvas.current, example);
    customCanvasWrapper.addScroller(scroller.current);
    customCanvasWrapper.addLines(lines.current);
    customCanvasWrapper.onSelectText(setHighlighted);
    customCanvasWrapper.draw();
    setCanvas(customCanvasWrapper);
  }, []);

  console.log(canvas)
  return (
    <div style={{ padding: "20px" }}>
      <StyledCanvasWrapper>
          <canvas
            ref={lines}
            width="50px"
            height="400px"
            style={{ outline: "none" }}
          ></canvas>
          <canvas
            tabIndex={0}
            ref={mainCanvas}
            width="400px"
            height="400px"
            style={{ outline: "none" }}
          ></canvas>
          <StyledScrollerViewport ref={scroller}>
            <StyledScrollerCursor />
          </StyledScrollerViewport>
      </StyledCanvasWrapper>
      <div style={{ marginTop: "10px" }}>Highlighted:</div>
      <StyledHightlightedText>{highlighted}</StyledHightlightedText>
      {canvas && (
        <Button label="Toggle raw" onClick={() => {canvas.text.setMode(canvas.text.mode === "raw"? "highlight" : "raw"); canvas.draw()}}/>
      )}
    </div>
  );
};

export default Canvas;
