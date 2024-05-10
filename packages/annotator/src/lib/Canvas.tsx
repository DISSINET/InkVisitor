import { useEffect } from "react";
import React from "react";
import { Annotator } from "./Annotator";
import { generateText } from "./index";

export const Canvas = () => {
  useEffect(() => {
    const customWrapper = new Annotator(
      document.getElementById("canvas") as HTMLCanvasElement,
      generateText(100)
    );
    customWrapper.addScroller(
      document.getElementById("scroller") as HTMLDivElement
    );
    customWrapper.addLines(
      document.getElementById("lines") as HTMLCanvasElement
    );
    customWrapper.onSelectText((text) => {
      (
        document.getElementById("highlight-container") as HTMLElement
      ).innerHTML = text;
    });
    customWrapper.draw();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div
        className="textarea"
        style={{ display: "flex", flexDirection: "row" }}
      >
        <div
          className="canvasses-wrapper"
          style={{ border: "1px solid black", padding: "2px" }}
        >
          <div style={{ display: "flex" }}>
            <canvas
              id="lines"
              className="lines"
              width="50px"
              height="400px"
              style={{ outline: "none", backgroundColor: "lime" }}
            ></canvas>
            <canvas
              tabIndex={0}
              id="canvas"
              width="400px"
              height="400px"
              style={{ outline: "none" }}
            ></canvas>
            <div
              className="scroller-viewport"
              id="scroller"
              style={{
                background: "#ccc",
                position: "relative",
                width: "10px",
              }}
            >
              <div
                className="scroller-cursor"
                style={{
                  cursor: "move",
                  position: "absolute",
                  width: "10px",
                  backgroundColor: "blue",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: "10px" }}>Highlighted:</div>
      <pre
        id="highlight-container"
        style={{
          padding: "10px",
          border: "1px solid black",
          marginTop: "10px",
        }}
      ></pre>
      <textarea></textarea>
    </div>
  );
};

export default Canvas;
