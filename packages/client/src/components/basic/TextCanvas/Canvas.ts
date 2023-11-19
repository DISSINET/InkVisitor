import { MutableRefObject, RefObject } from "react";
import { render } from "react-dom";

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

/**
 * Cursor represents active position in the viewport
 */
class Cursor {
  x: number = -1;
  y: number = -1

  constructor() {
  }

  yToLineI(y: number, lineHeight: number): number {
    return Math.floor(y / lineHeight);
  };

  xToCharI(x: number, charWidth: number): number {
    return Math.floor(x / charWidth);
  };

  onMouseClick(e: MouseEvent, lineHeight: number, charWidth: number) {
    const [x, y] = [e.offsetX, e.offsetY];
    this.x = this.xToCharI(x, charWidth);
    this.y = this.yToLineI(y, lineHeight);
  }

  move(xDelta: number, yDelta: number) {
    if (this.x === -1 && this.y === -1 || (!xDelta && !yDelta)) {
      return
    }

    this.x += xDelta
    this.y += yDelta
  }

  draw(ctx: CanvasRenderingContext2D, lineHeight: number, charWidth: number) {
    if (this.x === -1 && this.y === -1) {
      return
    }

    ctx.fillRect(this.x * charWidth, this.y * lineHeight + 2, 3, lineHeight)
  }
}

/**
 * Viewpoer represents currently visible part of the rendered text
 */
class Viewport {
  lineStart: number
  lineEnd: number

  constructor(lineStart: number, lineEnd: number) {
    this.lineStart = lineStart;
    this.lineEnd = lineEnd;
  }

  scrollDown(step: number, maxLines: number) {
    if (this.lineEnd + step < maxLines) {
      this.lineStart+=step;
      this.lineEnd+=step;
    }
  }

  scrollUp(step: number) {
    if(this.lineStart - step >= 0) {
      this.lineStart-=step;
      this.lineEnd-=step;
    }
  }

  scrollTo(textLine: number, maxLines: number) {
    console.log(this.lineStart, this.lineEnd, textLine)
    if (this.lineStart <= textLine && this.lineEnd >= textLine) {
      return; // no need to scroll
    }

    if (this.lineStart > textLine) {
      this.scrollUp(this.lineStart - textLine);
    } else if (this.lineEnd < textLine) {
      this.scrollDown(textLine - this.lineEnd, maxLines)
    }
  }
}

class Canvas {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  font = "12px Monospace"
  charWidth: number = 0;
  lineHeight: number = 15;
  width: number = 0;
  height: number = 0;
  viewport: Viewport;
  cursor: Cursor;
  text?: string;
  lines: ILine[] = [];

  constructor(element: HTMLCanvasElement) {
    this.element = element;
    const ctx = this.element.getContext("2d");
    if (!ctx) {
      throw new Error("Cannot get 2d context")
    }
    this.ctx = ctx;
    this.width = this.element.width
    this.height = this.element.height;
    this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789")
    this.viewport = new Viewport(-1, -1);
    this.cursor = new Cursor();

    this.element.onwheel = this.onWheel.bind(this);
    this.element.onmouseup = this.onMouseUp.bind(this);
    this.element.onkeydown = this.onKeyDown.bind(this);
  }

  onKeyDown(e: KeyboardEvent) {
    e.preventDefault();

    switch (e.key) {
      case "ArrowUp":
        this.cursor.move(0, -1)
        if (this.cursor.y < 0) {          
          this.viewport.scrollTo(this.viewport.lineStart + this.cursor.y, this.lines.length);
          this.cursor.y = 0;
        }
        break;

      case "ArrowDown":
        this.cursor.move(0, 1)
        if (this.cursor.y >= this.viewport.lineEnd - this.viewport.lineStart) {
          this.viewport.scrollTo(this.viewport.lineStart + this.cursor.y, this.lines.length);
          this.cursor.y = this.viewport.lineEnd - this.viewport.lineStart;
          console.log("setting again", this.viewport, this.cursor.y )
        }
        break;

      case "ArrowLeft":
        this.cursor.move(-1, 0)
        if (this.cursor.x < 0) {
          this.cursor.x = 0;
        }
        break;

      case "ArrowRight":
        this.cursor.move(1, 0)
        if (this.cursor.x > Math.floor((this.width) / this.charWidth)) {
          this.cursor.x--;
        }
        break;
    }

    this.draw();
  }

  onMouseUp(e: MouseEvent) {
    this.cursor.onMouseClick(e, this.lineHeight, this.charWidth);
    this.draw();
  }

  onWheel(e: any) {
    const up = e.deltaY < 0 ? false : true;
    if (up) {
      this.viewport.scrollDown(1, this.lines.length)
    } else if (!up) {
      this.viewport.scrollUp(1)
    }

    e.preventDefault();
    this.writeText("");
  }

  initialize() {
    console.log('Custom logic executed!');
  }

  prepareText(text: string) {
    const time1 = new Date();

    const lines: ILine[] = [];
    let lineStart = 0;

    const charsInLine = Math.floor((this.width - 80) / this.charWidth);

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
      `text of length ${text.length} parsed into ${lines.length} lines in ${time2.valueOf() - time1.valueOf()
      }ms `
    );
    this.lines = lines
  }

  setCharWidth(txt: string) {
    this.ctx.font = this.font;
    const textW = this.ctx.measureText(txt).width;
    this.charWidth = textW / txt.length;
  }

  writeText(text: string) {
    if (!this.text) {
      this.text = text;

      this.viewport = new Viewport(0, Math.floor(this.height / this.lineHeight) - 1);
      this.prepareText(text);
    }

    this.draw();
  }

  draw() {
    this.ctx.reset();
    this.ctx.font = this.font;

    for (let renderLine = 0; renderLine <= this.viewport.lineEnd - this.viewport.lineStart; renderLine++) {
      console.log("render", )
      const textLine = this.lines[this.viewport.lineStart + renderLine];
      this.ctx.fillText(textLine.text, 0, (renderLine + 1) * this.lineHeight);
    }

    this.cursor.draw(this.ctx, this.lineHeight, this.charWidth);
  }
}

export default Canvas