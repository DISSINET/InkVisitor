import { useEffect, useRef, useState } from "react";
import React from "react";
import { CanvasLib, generateText } from "@inkvisitor/canvas";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./CanvasStyles";
import { Button } from "components/basic/Button/Button";
import { useCanvas } from "./CanvasContext";

export const Canvas = () => {
  const canvasApi = useCanvas();

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setHighlighted] = useState("");
  const [useRawText, setUseRawText] = useState(false);

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const customCanvasWrapper = new CanvasLib(mainCanvas.current, generateText(100));
    customCanvasWrapper.addScroller(scroller.current);
    customCanvasWrapper.addLines(lines.current);
    customCanvasWrapper.onHighlightChange(setHighlighted);
    customCanvasWrapper.draw();
    canvasApi.setApi(customCanvasWrapper)
  }, []);

  useEffect(() => {
   // customCanvasWrapper.showRaw(useRawText);
  }, [useRawText]);

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
      <Button label="Toggle raw" onClick={() => setUseRawText(!useRawText)}/>
    </div>
  );
};

export default Canvas;
