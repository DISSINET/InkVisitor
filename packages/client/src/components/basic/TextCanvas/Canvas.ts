import { MutableRefObject, RefObject } from "react";
import { render } from "react-dom";
import Viewport from "./Viewport";
import Cursor from "./Cursor";
import Text from "./Text";

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

class Scroller {
  element: HTMLDivElement;
  runner: HTMLDivElement;
  onChangeCb?: (percentage: number) => void;

  constructor(element: HTMLDivElement) {
    this.element = element;
    const runner = element.firstChild;
    if (!runner) {
      throw new Error("Runner for Scroller not found");
    }
    this.runner = runner as HTMLDivElement;
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.runner.onmousedown = this.onRunnerMouseDown.bind(this);
  }

  update(startLine: number, endLine: number, totalLines: number) {
    const viewportLines = endLine - startLine + 1;
    const percentage = (startLine * 100) / (totalLines - viewportLines);
    const availableHeight =
      this.element.clientHeight - this.runner.clientHeight;
    this.runner.style["top"] = `${(availableHeight / 100) * percentage}px`;
  }

  onRunnerMouseDown(e: MouseEvent) {
    e.stopPropagation();
  }

  onMouseDown(e: MouseEvent) {
    const availableHeight = this.element.clientHeight;
    if (this.onChangeCb) {
      this.onChangeCb((e.offsetY * 100) / availableHeight);
    }
  }

  onChange(cb: (percentage: number) => void) {
    this.onChangeCb = cb;
  }
}

class Canvas {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  font: string = "12px Monospace";
  charWidth: number = 0;
  lineHeight: number = 15;
  width: number = 0;
  height: number = 0;

  viewport: Viewport;
  cursor: Cursor;
  text: Text;
  lines: ILine[] = [];
  scroller?: Scroller;

  constructor(element: HTMLCanvasElement, inputText: string) {
    this.element = element;
    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context");
    }
    this.ctx = ctx;
    this.width = this.element.width;
    this.height = this.element.height;
    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789");

    console.log("constructor", this.width, this.charWidth);
    const charsAtLine = Math.floor(this.width / this.charWidth);

    const noLinesViewport = Math.floor(this.height / this.lineHeight) - 1;
    this.viewport = new Viewport(0, noLinesViewport);
    this.cursor = new Cursor();

    this.text = new Text(inputText, charsAtLine);

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.element.onkeydown = this.onKeyDown.bind(this);
  }

  initialize() {
    console.log("Custom logic executed!");
    this.draw();
  }

  onKeyDown(e: KeyboardEvent) {
    e.preventDefault();

    switch (e.key) {
      case "ArrowUp":
        this.cursor.move(0, -1);
        if (this.cursor.y < 0) {
          this.viewport.scrollTo(
            this.viewport.lineStart + this.cursor.y,
            this.text.noLines
          );
          this.cursor.y = 0;
        }
        break;

      case "ArrowDown":
        this.cursor.move(0, 1);
        if (this.cursor.y > this.viewport.lineEnd - this.viewport.lineStart) {
          this.viewport.scrollTo(
            this.viewport.lineStart + 1,
            this.text.noLines
          );
          this.cursor.y = this.viewport.lineEnd - this.viewport.lineStart;
        }
        break;

      case "ArrowLeft":
        this.cursor.move(-1, 0);
        if (this.cursor.x < 0) {
          this.cursor.x = 0;
        }
        break;

      case "ArrowRight":
        this.cursor.move(1, 0);
        if (this.cursor.x > Math.floor(this.width / this.charWidth)) {
          this.cursor.x--;
        }
        break;

      case "Backspace":
        this.text.deleteText(this.viewport, this.cursor, 1);
        this.cursor.move(-1, 0);
        break;
        
      default:
        // writing to text
        const key = e.key;
        const nonCharKeys = [
          "CapsLock",
          "Shift",
          "Control",
          "Alt",
          "Tab",
          "Escape",
          "Enter",
        ];
        
        if (!nonCharKeys.includes(key)) {
          this.text.insertText(this.viewport, this.cursor, key);
          this.cursor.move(+1, 0);
        }
    }

    this.draw();
  }

  onMouseDown(e: MouseEvent) {
    this.cursor.onMouseClick(e, this.lineHeight, this.charWidth);
    this.draw();
  }

  onWheel(e: any) {
    const up = e.deltaY < 0 ? false : true;
    if (up) {
      this.viewport.scrollDown(1, this.text.noLines);
    } else if (!up) {
      this.viewport.scrollUp(1);
    }

    e.preventDefault();
    // this.writeText("");
  }

  addScroller(scrollerDiv: HTMLDivElement) {
    this.scroller = new Scroller(scrollerDiv);
    this.scroller.onChange((percentage: number) => {
      const toLine = Math.floor(
        ((this.text.noLines -
          (this.viewport.lineEnd - this.viewport.lineStart)) /
          100) *
          percentage
      );
      this.viewport.scrollTo(toLine, this.text.noLines);
      this.draw();
    });
  }

  // prepareText(text: string) {
  //   const time1 = new Date();

  //   const lines: ILine[] = [];
  //   let lineStart = 0;

  //   const charsInLine = Math.floor((this.width - 80) / this.charWidth);

  //   for (let charI = 0; charI < text.length; charI++) {
  //     // If we've hit a space or are at the end of the text
  //     if (text[charI] === " " || charI === text.length - 1) {
  //       if (charI - lineStart >= charsInLine) {
  //         // Find last space or punctuation to avoid breaking words
  //         let splitAt = charI;
  //         while (
  //           splitAt > lineStart &&
  //           ![" ", ",", ".", ";", "!", "?"].includes(text[splitAt])
  //         ) {
  //           splitAt--;
  //         }

  //         // If no space or punctuation is found, just split at the current position
  //         if (splitAt === lineStart) {
  //           splitAt = charI;
  //         }

  //         const lineText = text.slice(lineStart, splitAt);
  //         const words: IWord[] = [];

  //         // Split the lineText into words
  //         const wordMatches = lineText.match(/\b\w+\b/g);

  //         if (wordMatches) {
  //           let wordStart = 0;
  //           wordMatches.forEach((word) => {
  //             const wordIndex = lineText.indexOf(word, wordStart);
  //             const wordEnd = wordIndex + word.length;
  //             words.push({ text: word, iFrom: wordIndex, iTo: wordEnd });
  //             wordStart = wordEnd;
  //           });
  //         }

  //         lines.push({
  //           lineI: lines.length,
  //           iFrom: lineStart,
  //           iTo: lineStart + lineText.length,
  //           text: lineText,
  //           words,
  //         });
  //         lineStart = splitAt + 1;
  //       }
  //     }
  //   }

  //   // Add any remaining text
  //   if (lineStart < text.length) {
  //     const words: IWord[] = [];

  //     // Split the lineText into words
  //     const lineText = text.slice(lineStart);
  //     const wordMatches = lineText.match(/\b\w+\b/g);

  //     if (wordMatches) {
  //       let wordStart = 0;
  //       wordMatches.forEach((word) => {
  //         const wordIndex = lineText.indexOf(word, wordStart);
  //         const wordEnd = wordIndex + word.length;
  //         words.push({ text: word, iFrom: wordIndex, iTo: wordEnd });
  //         wordStart = wordEnd;
  //       });
  //     }

  //     lines.push({
  //       lineI: lines.length,
  //       text: lineText,
  //       iFrom: lineStart,
  //       iTo: lineStart + lineText.length,
  //       words,
  //     });
  //   }

  //   const time2 = new Date();
  //   console.log(
  //     `text of length ${text.length} parsed into ${lines.length} lines in ${time2.valueOf() - time1.valueOf()
  //     }ms `
  //   );
  //   this.lines = lines
  // }

  setCharWidth(txt: string) {
    this.ctx.font = this.font;
    const textW = this.ctx.measureText(txt).width;
    this.charWidth = textW / txt.length;
  }

  // writeText(text: string) {
  //   if (!this.text) {
  //     this.text = text;

  //     this.viewport = new Viewport(0, Math.floor(this.height / this.lineHeight) - 1);
  //     this.prepareText(text);
  //   }

  //   this.draw();
  // }

  draw() {
    this.ctx.reset();
    this.ctx.font = this.font;

    const textToRender = this.text.getViewportText(this.viewport);
    for (
      let renderLine = 0;
      renderLine <= this.viewport.lineEnd - this.viewport.lineStart;
      renderLine++
    ) {
      const textLine = textToRender[renderLine];
      if (textLine) {
        this.ctx.fillText(textLine, 0, (renderLine + 1) * this.lineHeight);
      }
    }

    this.cursor.draw(this.ctx, this.lineHeight, this.charWidth);

    if (this.scroller) {
      this.scroller.update(
        this.viewport.lineStart,
        this.viewport.lineEnd,
        this.text.noLines
      );
    }
    console.log("render");
  }
}

export default Canvas;
