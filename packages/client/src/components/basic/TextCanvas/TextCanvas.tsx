// TextCanvas.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";

interface TextCanvasProps {
  text: string;
  width: number;
  height: number;
}
interface ILine {
  text: string; // textual content of the particular line
}

const TextCanvas: React.FC<TextCanvasProps> = ({ text, width, height }) => {
  const [cursorLine, setCursorLine] = useState<number>(0); // line position of the cursor
  const [cursorChar, setCursorChar] = useState<number>(0); // position of the cursor within line

  const [scrollLine, setScrollLine] = useState<number>(0);

  const [currentText, setCurrentText] = useState<string>(text);

  const lineHeight = 20; // one line pixels

  const FONT = "16px Monospace";

  // canvases
  const canvasTextRef = useRef<HTMLCanvasElement>(null);
  const canvasCursorRef = useRef<HTMLCanvasElement>(null);

  const numberOfLines = useMemo<number>(() => {
    return Math.floor(height / lineHeight);
  }, [height, lineHeight]);
  /**
   * the first and last line displayed in the canvas
   */
  const viewPort = useMemo<[number, number]>(() => {
    return [scrollLine, scrollLine + numberOfLines];
  }, [scrollLine, lineHeight]);

  const charWidth = useMemo<number>(() => {
    const canvas = document.createElement("canvas");
    const txt = "Rando text";
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx!.font = FONT;
      ctx!.fillText(txt, 0, 0);
      const textW = ctx!.measureText(txt).width;
      console.log("checking text size", textW);
      return textW / txt.length;
    }
    return 8;
  }, []);

  const lineMap = useMemo<ILine[]>(() => {
    const time1 = new Date();

    const lines: ILine[] = [];
    let lineStart = 0;

    const charsInLine = (width - 80) / charWidth;
    console.log("characters in one line", charsInLine);

    for (let charI = 0; charI < text.length; charI++) {
      // If we've hit a space or are at the end of the text
      if (text[charI] === " " || charI === text.length - 1) {
        if (charI - lineStart >= charsInLine) {
          // Find last space or punctuation to avoid breaking words
          let splitAt = charI;
          while (
            splitAt > lineStart &&
            ![" ", ",", ".", ";", "!", "?"].includes(text[splitAt])
          ) {
            splitAt--;
          }

          // If no space or punctuation is found, just split at current position
          if (splitAt === lineStart) {
            splitAt = charI;
          }

          lines.push({ text: text.slice(lineStart, splitAt) });
          lineStart = splitAt + 1;
        }
      }
    }

    // Add any remaining text
    if (lineStart < text.length) {
      lines.push({ text: text.slice(lineStart) });
    }

    const time2 = new Date();
    console.log(
      `text of length ${text.length} parsed into ${lines.length} lines in ${
        time2.valueOf() - time1.valueOf()
      }ms `
    );
    return lines;
  }, [text, charWidth]);

  useEffect(() => {
    const canvas = canvasTextRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx!.clearRect(0, 0, width, height);
      ctx!.font = FONT;

      // TODO rerenders the text into canvas
      for (let i = 0; i < lineMap.length && i * lineHeight < height; i++) {
        const line = lineMap[i + scrollLine];
        if (line) {
          ctx!.fillText(line.text, 0, (i + 1) * lineHeight);
        }
      }
    }
  }, [currentText, scrollLine, lineMap, width, height]);

  useEffect(() => {
    const canvas = canvasCursorRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx!.clearRect(0, 0, width, height);
      ctx!.font = FONT;

      // TODO rerenders the cursor
      const cursorX = cursorChar * charWidth;
      const cursorY = (cursorLine - scrollLine) * lineHeight;
      ctx!.fillRect(cursorX, cursorY, 2, lineHeight + 5);
    }
  }, [currentText, scrollLine, cursorChar, cursorLine, width, height]);

  /**
   * This function checks if the scrolled viewport is not off the current cursor
   */
  useEffect(() => {
    if (cursorLine >= viewPort[1]) {
      setScrollLine(cursorLine - numberOfLines + 1);
    }
    if (cursorLine < viewPort[0]) {
      setScrollLine(cursorLine);
    }
  }, [cursorChar, cursorLine]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    switch (e.key) {
      case "ArrowUp":
        setCursorLine(cursorLine > 0 ? cursorLine - 1 : 0);
        break;

      case "ArrowDown":
        setCursorLine(
          cursorLine < lineMap.length - 1 ? cursorLine + 1 : lineMap.length - 1
        );
        break;

      case "ArrowLeft":
        if (cursorChar > 0) {
          setCursorChar(cursorChar - 1);
        } else if (cursorLine > 0) {
          setCursorLine(cursorLine - 1);
          setCursorChar(lineMap[cursorLine - 1].text.length);
        }
        break;
      case "PageDown":
        setCursorLine(
          cursorLine < lineMap.length - 50 ? cursorLine + 50 : lineMap.length - 50
        );
        break;

      case "ArrowRight":
        if (cursorChar < lineMap[cursorLine].text.length) {
          setCursorChar(cursorChar + 1);
        } else if (cursorLine < lineMap.length - 1) {
          setCursorLine(cursorLine + 1);
          setCursorChar(0);
        }
        break;

      default:
        break;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="textarea" style={{    display: "flex", flexDirection: "row"}}>
        <div className="canvasses-wrapper" style={{
            border: "1px solid black",
            padding: "2px"
        }}>
        <div
          style={{
            position: "relative",
            width: `${width}px`,
            height: `${height}px`,
          }}
        >
          {/* canvas for text */}
           <canvas
            ref={canvasTextRef}
            width={width}
            height={height}
            style={{ position: "absolute", top: "0", left: "0" }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          ></canvas>

          {/* canvas for cursor */}
          <canvas
            ref={canvasCursorRef}
            width={width}
            height={height}
            style={{ position: "absolute", top: "0", left: "0", zIndex: 1 }}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          ></canvas>
          </div>
        </div>
        <div className="scroller" style={{
              display: "flex",
              flexDirection: "column",
              position: "relative",
              marginBottom: "15px"
        }}>
          <span style={{
              position: "absolute",
              top: `calc(${(cursorLine +1)/lineMap.length * 100}%)`,
              height: `15px`,
              background: "pink",
              border: "1px solid blue"
          }}>{((cursorLine +1)/lineMap.length * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="info-container"
          style={{
            padding: "10px",
            border: "1px solid black",
            marginTop: "10px",
          }}
        >
          <p>Cursor Line: {cursorLine + 1}</p>{" "}
          {/* +1 to make it 1-based instead of 0-based */}
          <p>Cursor Char: {cursorChar + 1}</p>
          <p>
            Scroll Line: {scrollLine + 1} / {lineMap.length}
          </p>
      </div>
    </div>
  );
};

export default TextCanvas;
