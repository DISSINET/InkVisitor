// TextCanvas.tsx
import theme from "Theme/theme";
import React, { useState, useRef, useEffect, useMemo } from "react";

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
  const [cursorLineI, setCursorLineI] = useState<number>(0); // line position of the cursor
  const [cursorGhostLineI, setCursorGhostLineI] = useState<false | number>(
    false
  ); // line position of the cursor
  const [text, setText] = useState<string>(inputText);

  const [cursorCharI, setcursorCharI] = useState<number>(0); // position of the cursor within line

  const [scrollLineI, setScrollLineI] = useState<number>(0);

  const [currentText, setCurrentText] = useState<string>(text);

  const [focused, setFocused] = useState<boolean>();

  const lineHeight = 15; // one line pixels

  // scroller
  const scrollerW = 15;

  const FONT = "12px Monospace";

  // canvases
  const canvasTextRef = useRef<HTMLCanvasElement>(null);
  const canvasCursorRef = useRef<HTMLCanvasElement>(null);

  const canvasNoLines = useMemo<number>(() => {
    return Math.floor(height / lineHeight);
  }, [height, lineHeight]);

  /**
   * the first and last line displayed in the canvas
   */
  const viewPort = useMemo<[number, number]>(() => {
    return [scrollLineI, scrollLineI + canvasNoLines];
  }, [scrollLineI, lineHeight]);

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

  const yToLineI = (y: number): number => {
    return viewPort[0] + Math.floor(y / lineHeight);
  };

  const xToCharI = (x: number): number => {
    return Math.floor(x / charWidth);
  };

  // handle scrollLineI when cursor is out of viewport
  useEffect(() => {
    if (cursorLineI < viewPort[0] || cursorLineI > viewPort[1]) {
      setScrollLineI(cursorLineI);
    }
  }, [viewPort, cursorLineI]);

  const [lineMap, setLineMap] = useState<ILine[]>([]);

  useEffect(() => {
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

          lines.push({
            lineI: lines.length,
            iFrom: lineStart,
            iTo: lineStart + lineText.length,
            text: lineText,
            words,
          });
          lineStart = splitAt + 1;
        }
      }
    }

    // Add any remaining text
    if (lineStart < text.length) {
      const words: IWord[] = [];

      // Split the lineText into words
      const lineText = text.slice(lineStart);
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

      lines.push({
        lineI: lines.length,
        text: lineText,
        iFrom: lineStart,
        iTo: lineStart + lineText.length,
        words,
      });
    }

    const time2 = new Date();
    console.log(
      `text of length ${text.length} parsed into ${lines.length} lines in ${
        time2.valueOf() - time1.valueOf()
      }ms `
    );
    setLineMap(lines);
  }, [text, charWidth]);

  const linesNo = useMemo<number>(() => {
    return lineMap.length;
  }, [lineMap]);

  const cursorLineP = useMemo<number>(() => {
    return ((cursorLineI + 1) / linesNo) * 100;
  }, [cursorLineI, lineMap]);

  const cursorGhostLineP = useMemo<number>(() => {
    if (cursorGhostLineI === false) {
      return 0;
    }
    return ((cursorGhostLineI + 1) / linesNo) * 100;
  }, [cursorGhostLineI, lineMap]);

  const cursorLine = useMemo<ILine | undefined>(() => {
    if (lineMap[cursorLineI]) {
      return lineMap[cursorLineI];
    } else {
      return lineMap[0];
    }
  }, [cursorLineI, lineMap]);

  const cursorLineNext = useMemo<ILine | undefined>(() => {
    const cursorLineNextI = cursorLineI + 1;
    return cursorLineNextI <= linesNo ? lineMap[cursorLineNextI] : undefined;
  }, [cursorLineI, lineMap]);

  const cursorLinePrev = useMemo<ILine | undefined>(() => {
    const cursorLinePrevI = cursorLineI - 1;
    return cursorLinePrevI >= 0 ? lineMap[cursorLinePrevI] : undefined;
  }, [cursorLineI, lineMap]);

  // actual word at the cursor position
  const cursorWord = useMemo<IWord | undefined>(() => {
    return cursorLine
      ? cursorLine.words.find((word) => {
          return word.iFrom <= cursorCharI && word.iTo >= cursorCharI;
        })
      : undefined;
  }, [cursorCharI, cursorLine, lineMap]);

  // next word at the cursor position
  const cursorWordNext = useMemo<[IWord, number] | undefined>(() => {
    let foundWord: [IWord, number] | undefined = undefined;

    // const lastWordInCurLine = cursorLine.words[cursorLine.words.length - 1]
    // lastWordInCurLine.iTo

    if (!cursorLine) {
      return undefined;
    }
    cursorLine.words.forEach((word, wi) => {
      const wordNext = cursorLine.words[wi + 1];
      if (wordNext) {
        if (word.iFrom <= cursorCharI && word.iTo >= cursorCharI) {
          foundWord = [wordNext, cursorLineI];
          return;
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
  }, [cursorCharI, cursorLine, lineMap]);

  // prev word at the cursor position
  const cursorWordPrev = useMemo<[IWord, number] | undefined>(() => {
    let foundWord: [IWord, number] | undefined = undefined;
    if (!cursorLine) {
      return undefined;
    }

    cursorLine.words.forEach((word, wi) => {
      const wordPrev = cursorLine.words[wi - 1];
      if (wordPrev) {
        if (word.iFrom <= cursorCharI && word.iTo >= cursorCharI) {
          foundWord = [wordPrev, cursorLineI];
        }
      }
    });

    if (!foundWord) {
      // a word from prev line
      if (cursorLinePrev) {
        return [
          cursorLinePrev.words[cursorLinePrev.words.length - 1],
          cursorLinePrev.lineI,
        ];
      }
    }

    return foundWord;
  }, [cursorCharI, cursorLine, lineMap]);

  useEffect(() => {
    const canvas = canvasTextRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx!.clearRect(0, 0, width, height);
      ctx!.font = FONT;

      // TODO rerenders the text into canvas
      for (let i = 0; i < linesNo && i * lineHeight < height; i++) {
        const line = lineMap[i + scrollLineI];
        if (line) {
          ctx!.fillText(line.text, 0, (i + 1) * lineHeight);
        }
      }
    }
  }, [currentText, scrollLineI, lineMap, width, height]);

  // drawing cursor pointer
  useEffect(() => {
    const canvas = canvasCursorRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");

      ctx!.clearRect(0, 0, width, height);

      ctx!.font = FONT;
      // TODO rerenders the cursor
      const cursorX = cursorCharI * charWidth;
      const cursorY = (cursorLineI - scrollLineI) * lineHeight;
      ctx!.fillRect(cursorX, cursorY, 2, lineHeight + 5);
    }
  }, [
    currentText,
    scrollLineI,
    cursorCharI,
    cursorLine,
    width,
    height,
    focused,
  ]);

  /**
   * This function checks if the scrolled viewport is not off the current cursor
   */
  useEffect(() => {
    if (cursorLineI >= viewPort[1]) {
      setScrollLineI(cursorLineI - canvasNoLines + 1);
    }
    if (cursorLineI < viewPort[0]) {
      setScrollLineI(cursorLineI);
    }
  }, [cursorCharI, cursorLineI]);

  const handleClick = (e: React.MouseEvent) => {
    // @ts-ignore
    const [x, y] = [e.nativeEvent.layerX, e.nativeEvent.layerY];

    const newLineI = yToLineI(y);
    setCursorLineI(newLineI);

    const newCharI = xToCharI(x);
    setcursorCharI(newCharI);
  };

  const handleScrollClick = (e: React.MouseEvent) => {
    // @ts-ignore
    const y = e.nativeEvent.layerY;
    const newScrollI = Math.floor((y / height) * linesNo);

    setCursorLineI(newScrollI);
  };

  const handleScrollOver = (e: React.MouseEvent) => {
    // @ts-ignore
    const y = e.nativeEvent.layerY;
    const newScrollI = Math.floor((y / height) * linesNo);

    setCursorGhostLineI(newScrollI);
  };

  const handleScrollOut = () => {
    setCursorGhostLineI(false);
  };

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
          cursorLineI < linesNo - 1 ? cursorLineI + 1 : linesNo - 1
        );
        break;

      case "ArrowLeft":
        if (ctrlKey && cursorWord) {
          // Ctrl + Arrow Left: Move to the left by a whole word
          if (cursorCharI === cursorWord.iFrom && cursorWordPrev) {
            setcursorCharI(cursorWordPrev[0].iFrom);

            // reaching prev line
            if (cursorWord.iFrom < cursorWordPrev[0].iFrom) {
              setCursorLineI(cursorWordPrev[1]);
            }
          } else {
            setcursorCharI(cursorWord.iFrom);
          }
        } else if (cursorCharI > 0) {
          setcursorCharI(cursorCharI - 1);
        } else if (cursorLineI > 0) {
          setCursorLineI(cursorLineI - 1);
          setcursorCharI(lineMap[cursorLineI - 1].text.length);
        }
        break;

      case "ArrowRight":
        if (ctrlKey && cursorWord) {
          // Ctrl + Arrow Right: Move to the right by a whole word
          if (cursorCharI === cursorWord.iTo && cursorWordNext) {
            setcursorCharI(cursorWordNext[0].iTo);
            // reaching next line
            if (cursorWord.iFrom > cursorWordNext[0].iFrom) {
              setCursorLineI(cursorWordNext[1]);
            }
          } else {
            setcursorCharI(cursorWord.iTo);
          }
        } else if (cursorCharI < lineMap[cursorLineI].text.length) {
          setcursorCharI(cursorCharI + 1);
        } else if (cursorLineI < linesNo - 1) {
          setCursorLineI(cursorLineI + 1);
          setcursorCharI(0);
        }
        break;

      // page up + down
      case "PageUp":
        const lLineIAfterPgUp =
          cursorLineI > pageJump ? cursorLineI - pageJump : 0;
        setCursorLineI(lLineIAfterPgUp);
        break;
      case "PageDown":
        const lineIAfterPgDown =
          cursorLineI + pageJump < linesNo
            ? cursorLineI + pageJump
            : linesNo - 1;

        setCursorLineI(lineIAfterPgDown);
        break;

      default:
        // writing to text
        console.log(e.key);
        if (e.key === "Backspace") {
          if (cursorLine) {
            const deleteI = cursorLine.iFrom + cursorCharI - 1;
            setText(text.slice(0, deleteI) + text.slice(deleteI + 1));
            setcursorCharI(cursorCharI - 1);
          }
        }

        //   const newLineMap = [...lineMap]

        //   newLineMap[cursorLineI].words.map(word => {
        //     if (word.iFrom < cursorCharI && word.iTo > cursorCharI) {
        //       return word.text
        //     }
        //     return word
        //   })
        // }
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
              onMouseDown={(e) => {
                handleClick(e);
              }}
              onFocus={() => {
                setFocused(true);
              }}
              tabIndex={0}
            ></canvas>
          </div>
        </div>
        <div
          className="scroller"
          style={{
            display: "flex",
            position: "relative",
          }}
        >
          <div
            className="scroller-wrapper"
            onMouseDown={(e) => {
              handleScrollClick(e);
            }}
            onMouseMove={(e) => {
              handleScrollOver(e);
            }}
            onMouseOut={(e) => {
              handleScrollOut();
            }}
            style={{
              position: "absolute",
              width: `${scrollerW}px`,
              border: "1px solid black",
              backgroundColor: theme.color.blue[100],
              top: 0,
              bottom: 0,
            }}
          />
          <div
            className="scroller-viewport"
            style={{
              position: "absolute",
              width: `${scrollerW}px`,
              top: `calc(${((viewPort[0] + 1) / linesNo) * 100}%)`,
              bottom: `calc(${((linesNo - viewPort[1] + 1) / linesNo) * 100}%)`,
              backgroundColor: theme.color.blue[300],
            }}
          />
          <div
            className="scroller-cursor"
            style={{
              position: "absolute",
              height: "1px",
              width: `${scrollerW + 5}px`,
              top: `calc(${((viewPort[0] + 1) / linesNo) * 100}%)`,
              backgroundColor: theme.color.blue[500],
            }}
          />

          <span
            className="position-cursor-label"
            style={{
              position: "absolute",
              left: `${scrollerW + 7}px`,
              fontSize: "12px",
              fontWeight: "600",
              color: theme.color.blue[500],
              top: `calc(${((cursorLineI + 1) / linesNo) * 100}% - 6px)`,
            }}
          >
            {/* {`${cursorLineI}/${linesNo}`} */}
            {`${cursorLineP.toFixed(0)}%`}
          </span>

          {cursorGhostLineI && (
            <>
              <div
                className="scroller-cursor-ghost"
                style={{
                  position: "absolute",
                  height: "1px",
                  width: `${scrollerW + 5}px`,
                  top: `${cursorGhostLineP}%`,
                  backgroundColor: theme.color.gray[500],
                }}
              />
              <span
                className="position-cursor-label-ghost"
                style={{
                  position: "absolute",
                  left: `${scrollerW + 7}px`,
                  fontSize: "12px",
                  fontWeight: "500",
                  color: theme.color.gray[500],
                  top: `calc(${
                    ((cursorGhostLineI + 1) / linesNo) * 100
                  }% - 6px)`,
                }}
              >
                {/* {`${cursorLineI}/${linesNo}`} */}
                {`${cursorGhostLineP.toFixed(0)}%`}
              </span>
            </>
          )}
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
        <p>Cursor Char: {cursorCharI}</p>
        <p>
          Scroll Line: {scrollLineI} / {linesNo}
        </p>
        <p>
          {`Active word: ${cursorWord?.text} (${cursorWord?.iFrom} - ${cursorWord?.iTo}) `}{" "}
        </p>
      </div>
    </div>
  );
};

export default TextCanvas;
