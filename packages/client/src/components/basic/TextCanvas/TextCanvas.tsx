// TextCanvas.tsx
import theme from "Theme/theme";
import React, { useState, useRef, useEffect, useMemo } from "react";
import Canvas from "./Canvas";

interface TextCanvasProps {
  inputText: string;
  width: number;
  height: number;
}
interface ILine {
  lineI: number;
  iFrom: number;
  iTo: number;
  text: string; // textual  content of the particular line
  words: IWord[];
}
interface IWord {
  text: string; // actual word
  iFrom: number; // where the word starts
  iTo: number; // where the word ends
}

const TextCanvas: React.FC<TextCanvasProps> = ({
  inputText,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // useEffect hook to run logic after the component is mounted
  useEffect(() => {
    if (canvasRef.current && scrollerRef.current) {
      const customWrapper = new Canvas(canvasRef.current, inputText);
      customWrapper.initialize();
      customWrapper.addScroller(scrollerRef.current);
    }

    // Cleanup logic if needed
    return () => {
      // Add cleanup logic here if needed
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div
        className="textarea"
        style={{ display: "flex", flexDirection: "row" }}
      >
        <div
          className="canvasses-wrapper"
          style={{
            border: "1px solid black",
            padding: "2px",
          }}
        >
          <div style={{ display: "flex" }}>
            <canvas
              tabIndex={0}
              ref={canvasRef}
              width={width}
              height={height}
              style={{ outline: "none" }}
            />
            <div
              className="scroller-viewport"
              ref={scrollerRef}
              style={{
                background: "#ccc",
                position: "relative",
                width: `${10}px`,
              }}
            >
              <div
                className="scroller-cursor"
                style={{
                  position: "absolute",
                  height: "10px",
                  width: `10px`,
                  backgroundColor: theme.color.blue[500],
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="info-container"
        style={{
          padding: "10px",
          border: "1px solid black",
          marginTop: "10px",
        }}
      ></div>
    </div>
  );
};

export default TextCanvas;
