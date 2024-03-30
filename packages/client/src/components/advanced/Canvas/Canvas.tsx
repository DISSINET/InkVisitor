import { useEffect, useRef, useState } from "react";
import React from "react";
import { CanvasLib, generateText } from "@inkvisitor/canvas";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./CanvasStyles";

export const Canvas = () => {
  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setHighlighted] = useState("");

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const customWrapper = new CanvasLib(mainCanvas.current, generateText(100));
    customWrapper.addScroller(scroller.current);
    customWrapper.addLines(lines.current);
    customWrapper.onHighlightChange(setHighlighted);
    customWrapper.draw();
  }, []);

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
    </div>
  );
};

export default Canvas;
