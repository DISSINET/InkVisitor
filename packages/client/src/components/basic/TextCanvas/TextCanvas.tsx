// TextCanvas.tsx
import React, { useState, useRef, useEffect, useMemo } from "react";

interface TextCanvasProps {
  text: string;
  width: number;
  height: number;
}
interface ILine {
  lineI: number;
  text: string; // textual content of the particular line
  words: IWord[];
}
interface IWord {
  text: string; // actual word
  iFrom: number; // where the word starts
  iTo: number; // where the word ends
}

const TextCanvas: React.FC<TextCanvasProps> = ({ text, width, height }) => {
  const [cursorLineI, setCursorLineI] = useState<number>(0); // line position of the cursor
  const [cursorChar, setCursorChar] = useState<number>(0); // position of the cursor within line

  const [scrollLine, setScrollLine] = useState<number>(0);

  const [currentText, setCurrentText] = useState<string>(text);

  const lineHeight = 15; // one line pixels

  const FONT = "12px Monospace";

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

          // If no space or punctuation is found, just split at the current position
          if (splitAt === lineStart) {
            splitAt = charI;
          }

          const lineText = text.slice(lineStart, splitAt);
          const words: IWord[] = [];

          // Split the lineText into words
          const wordMatches = lineText.match(/\b\w+\b/g);

          if (wordMatches) {
            let wordStart = 0;
            wordMatches.forEach((word) => {
              const wordIndex = lineText.indexOf(word, wordStart);
              const wordEnd = wordIndex + word.length;
              words.push({ text: word, iFrom: wordIndex, iTo: wordEnd });
              wordStart = wordEnd;
            });
          }

          lines.push({ lineI: lines.length, text: lineText, words });
          lineStart = splitAt + 1;
        }
      }
    }

    // Add any remaining text
    if (lineStart < text.length) {
      lines.push({ lineI: lines.length, text: text.slice(lineStart), words: [] });
    }

    const time2 = new Date();
    console.log(
      `text of length ${text.length} parsed into ${lines.length} lines in ${
        time2.valueOf() - time1.valueOf()
      }ms `
    );
    return lines;
  }, [text, charWidth]);

  const cursorLine = useMemo<ILine>(() => {
    return lineMap[cursorLineI];
  }, [cursorLineI, lineMap]);

  const cursorLineNext = useMemo<ILine | undefined>(() => {
    const cursorLineNextI = cursorLineI + 1;
    return cursorLineNextI <= lineMap.length
      ? lineMap[cursorLineNextI]
      : undefined;
  }, [cursorLineI, lineMap]);

  const cursorLinePrev = useMemo<ILine | undefined>(() => {
    const cursorLinePrevI = cursorLineI - 1;
    return cursorLinePrevI >= 0 ? lineMap[cursorLinePrevI] : undefined;
  }, [cursorLineI, lineMap]);

  // actual word at the cursor position
  const cursorWord = useMemo<IWord>(() => {
    return (
      cursorLine.words.find((word) => {
        return word.iFrom <= cursorChar && word.iTo >= cursorChar;
      }) ?? cursorLine.words[0]
    );
  }, [cursorChar, cursorLine, lineMap]);

  // next word at the cursor position
  const cursorWordNext = useMemo<[IWord, number] | undefined>(() => {
    let foundWord: [IWord, number] | undefined = undefined

    // const lastWordInCurLine = cursorLine.words[cursorLine.words.length - 1]
    // lastWordInCurLine.iTo

    cursorLine.words.forEach((word, wi) => {
      const wordNext = cursorLine.words[wi + 1];
      if (wordNext) {
        if (word.iFrom <= cursorChar && word.iTo >= cursorChar) {
          foundWord = [wordNext, cursorLineI];
          return 
        }
      }
    });
    if (!foundWord) {
      // a word from the next line
      if (cursorLineNext) {
        foundWord = [cursorLineNext.words[0], cursorLineNext.lineI];
      }
    }

    return foundWord;
  }, [cursorChar, cursorLine, lineMap]);

  // prev word at the cursor position
  const cursorWordPrev = useMemo<[IWord, number] | undefined>(() => {
    let foundWord: [IWord, number] | undefined = undefined

    cursorLine.words.forEach((word, wi) => {
      const wordPrev = cursorLine.words[wi - 1];
      if (wordPrev) {
        if (word.iFrom <= cursorChar && word.iTo >= cursorChar) {
          foundWord = [wordPrev, cursorLineI];
        }
      }
    });

    if (!foundWord) {
      // a word from prev line
      if (cursorLinePrev) {
        return [cursorLinePrev.words[cursorLinePrev.words.length - 1], cursorLinePrev.lineI]
      }
    }

    return foundWord;
  }, [cursorChar, cursorLine, lineMap]);

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
      const cursorY = (cursorLineI - scrollLine) * lineHeight;
      ctx!.fillRect(cursorX, cursorY, 2, lineHeight + 5);
    }
  }, [currentText, scrollLine, cursorChar, cursorLine, width, height]);

  /**
   * This function checks if the scrolled viewport is not off the current cursor
   */
  useEffect(() => {
    if (cursorLineI >= viewPort[1]) {
      setScrollLine(cursorLineI - numberOfLines + 1);
    }
    if (cursorLineI < viewPort[0]) {
      setScrollLine(cursorLineI);
    }
  }, [cursorChar, cursorLineI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    // Check if the Ctrl key is also pressed
    const ctrlKey = e.ctrlKey || e.metaKey;

    const pageJump = 50;
    switch (e.key) {
      case "ArrowUp":
        setCursorLineI(cursorLineI > 0 ? cursorLineI - 1 : 0);
        break;

      case "ArrowDown":
        setCursorLineI(
          cursorLineI < lineMap.length - 1
            ? cursorLineI + 1
            : lineMap.length - 1
        );
        break;

      case "ArrowLeft":
        if (ctrlKey) {
          // Ctrl + Arrow Left: Move to the left by a whole word
          if (cursorChar === cursorWord.iFrom && cursorWordPrev) {
            setCursorChar(cursorWordPrev[0].iFrom);

            // reaching prev line
            if (cursorWord.iFrom < cursorWordPrev[0].iFrom) {
              setCursorLineI(cursorWordPrev[1])
            }
          } else {
            setCursorChar(cursorWord.iFrom);
          }
        } else if (cursorChar > 0) {
          setCursorChar(cursorChar - 1);
        } else if (cursorLineI > 0) {
          setCursorLineI(cursorLineI - 1);
          setCursorChar(lineMap[cursorLineI - 1].text.length);
        }
        break;

        case "ArrowRight":
          if (ctrlKey) {
            // Ctrl + Arrow Right: Move to the right by a whole word
            if (cursorChar === cursorWord.iTo && cursorWordNext) {
              setCursorChar(cursorWordNext[0].iTo);
              // reaching next line
              if (cursorWord.iFrom > cursorWordNext[0].iFrom) {
                setCursorLineI(cursorWordNext[1])
              }
            } else {
              setCursorChar(cursorWord.iTo);
          }
        } else if (cursorChar < lineMap[cursorLineI].text.length) {
          setCursorChar(cursorChar + 1);
        } else if (cursorLineI < lineMap.length - 1) {
          setCursorLineI(cursorLineI + 1);
          setCursorChar(0);
        }
        break;

      // page up + down
      case "PageUp":
        setCursorLineI(cursorLineI > pageJump ? cursorLineI - pageJump : 0);
        break;
      case "PageDown":
        setCursorLineI(
          cursorLineI < lineMap.length - pageJump
            ? cursorLineI + pageJump
            : lineMap.length
        );
        break;

      default:
        // writing to text
        console.log(e.key);
        break;
    }
  };

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
        <div
          className="scroller"
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            marginBottom: "15px",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: `calc(${((cursorLineI + 1) / lineMap.length) * 100}%)`,
              height: `15px`,
              background: "pink",
              border: "1px solid blue",
            }}
          >
            {(((cursorLineI + 1) / lineMap.length) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        className="info-container"
        style={{
          padding: "10px",
          border: "1px solid black",
          marginTop: "10px",
        }}
      >
        <p>Cursor Line: {cursorLineI}</p>{" "}
        {/* +1 to make it 1-based instead of 0-based */}
        <p>Cursor Char: {cursorChar}</p>
        <p>
          Scroll Line: {scrollLine} / {lineMap.length}
        </p>
        <p>
          {`Active word: ${cursorWord.text} (${cursorWord.iFrom} - ${cursorWord.iTo}) `}{" "}
        </p>
      </div>
    </div>
  );
};

export default TextCanvas;
