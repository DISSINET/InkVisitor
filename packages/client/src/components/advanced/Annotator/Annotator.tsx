import { useEffect, useRef, useState } from "react";
import React from "react";
import { Annotator, example, Mode } from "@inkvisitor/annotator/src/lib";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { Button } from "components/basic/Button/Button";
import { useAnnotator } from "./AnnotatorContext";

export const Canvas = () => {
  const {annotator, setAnnotator } = useAnnotator();

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setHighlighted] = useState("");

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const annotatorInstance = new Annotator(mainCanvas.current, example);
    annotatorInstance.addScroller(scroller.current);
    annotatorInstance.addLines(lines.current);
    annotatorInstance.onSelectText(setHighlighted);
    annotatorInstance.draw();
    setAnnotator(annotatorInstance);
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
      {annotator && (
        <Button label="Toggle raw" onClick={() => {annotator.text.setMode(annotator.text.mode === "raw"? "highlight" : "raw"); annotator.draw()}}/>
      )}
    </div>
  );
};

export default Canvas;
