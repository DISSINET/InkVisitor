import { useEffect, useRef, useState } from "react";
import React from "react";
import { Annotator, example, Highlighted} from "@inkvisitor/annotator/src/lib";
import {
  StyledCanvasWrapper,
  StyledHightlightedText,
  StyledLinesCanvas,
  StyledMainCanvas,
  StyledScrollerCursor,
  StyledScrollerViewport,
} from "./AnnotatorStyles";
import { Button } from "components/basic/Button/Button";
import { useAnnotator } from "./AnnotatorContext";

export const Canvas = () => {
  const { annotator, setAnnotator } = useAnnotator();

  const mainCanvas = useRef(null);
  const scroller = useRef(null);
  const lines = useRef(null);
  const [highlighted, setSelected] = useState<Highlighted>();

  useEffect(() => {
    if (!mainCanvas.current || !scroller.current || !lines.current) {
      return;
    }

    const annotatorInstance = new Annotator(mainCanvas.current, example);
    annotatorInstance.setMode("raw");
    annotatorInstance.addScroller(scroller.current);
    annotatorInstance.addLines(lines.current);
    annotatorInstance.onSelectText(setSelected);
    annotatorInstance.onHighlight((entity: string) => {
      console.log("highlight", entity)
      return {
       mode: "background",
       style: {
        color: "pink"
       }
      }
    })
    annotatorInstance.draw();
    setAnnotator(annotatorInstance);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <textarea />
      <StyledCanvasWrapper>
        <StyledLinesCanvas ref={lines} width="50px" height="400px" />
        <StyledMainCanvas
          tabIndex={0}
          ref={mainCanvas}
          width="400px"
          height="400px"
        />
        <StyledScrollerViewport ref={scroller}>
          <StyledScrollerCursor />
        </StyledScrollerViewport>
      </StyledCanvasWrapper>
      {highlighted && false && (
      <StyledHightlightedText>{highlighted?.text}</StyledHightlightedText>
      )}
      {annotator && (
        <Button
          label="Toggle raw"
          onClick={() => {
            annotator.setMode(
              annotator.text.mode === "raw" ? "highlight" : "raw"
            );
            annotator.draw();
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
