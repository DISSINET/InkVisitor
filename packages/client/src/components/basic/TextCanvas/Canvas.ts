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

class Canvas {
    element: HTMLCanvasElement;
    font = "12px Monospace";
    charWidth: number = 0;
    lineHeight: number = 15;
    width: number = 0;
    height: number = 0;
    viewport: { lineStart: number; lineEnd: number} = { lineStart: -1, lineEnd: -1};
    text?: string;
    lines: ILine[] = [];

    constructor(element: HTMLCanvasElement) {
        this.element = element;
        this.width = this.element.width
        this.height = this.element.height;
        this.element.onwheel = this.onWheel.bind(this)
    }

    onWheel(e: any) {
        const up = e.deltaY < 0 ? false: true;
        console.log(e)
        if (up && this.viewport.lineEnd < this.lines.length) {            
            this.viewport.lineStart++
            this.viewport.lineEnd++;
        } else if (!up && this.viewport.lineStart > 0) {
            this.viewport.lineStart--
            this.viewport.lineEnd--;            
        }

        e.preventDefault();
        this.writeText("");    
    }

    initialize() {
        console.log('Custom logic executed!');
        this.setCharWidth("abcdefghijklmnopqrstuvwxyz0123456789")
    }

    prepareText(text: string) {
        const time1 = new Date();

        const lines: ILine[] = [];
        let lineStart = 0;
    
        const charsInLine = Math.floor((this.width - 80) / this.charWidth);
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
          `text of length ${text.length} parsed into ${lines.length} lines in ${time2.valueOf() - time1.valueOf()
          }ms `
        );
        this.lines = lines
    }

    setCharWidth(txt: string) {
        const ctx = this.element.getContext("2d");
        ctx!.font = this.font;
        const textW = ctx!.measureText(txt).width;
        this.charWidth =  textW / txt.length;
    }

    writeText(text: string) {
        if (!this.text) {
            this.text = text;
            this.viewport = {lineStart: 0, lineEnd: Math.floor(this.height / this.lineHeight)}
            this.prepareText(text);
        }
        const ctx = this.element.getContext("2d");
        ctx?.reset()
        ctx!.font = this.font;
  
        for (let renderLine = 0; renderLine < this.viewport.lineEnd - this.viewport.lineStart; renderLine++) {
            const textLine = this.lines[this.viewport.lineStart + renderLine];
            ctx!.fillText(textLine.text, 0, (renderLine + 1) * this.lineHeight);
        }
    }
}

export default Canvas