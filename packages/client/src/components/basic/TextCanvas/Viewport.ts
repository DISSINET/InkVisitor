/**
 * Viewpoer represents currently visible part of the rendered text
 */
export default class Viewport {
    lineStart: number;
    noLines: number
  
    constructor(lineStart: number, lineEnd: number) {
      this.lineStart = lineStart;
      this.noLines = lineEnd;
    }
  

    get lineEnd(): number {
      return this.lineStart + this.noLines;
    }

    scrollDown(step: number, maxLines: number) {
      if (this.lineStart + this.noLines + step < maxLines) {
        this.lineStart+=step;
      }
    }
  
    scrollUp(step: number) {
      if(this.lineStart - step >= 0) {
        this.lineStart-=step;
      }
    }
  
    scrollTo(textLine: number, maxLines: number) {
  
      if (textLine > this.lineStart) {
        console.log("scroll down", this.lineStart, textLine)
        this.scrollDown(textLine - this.lineStart, maxLines)
      } else if (textLine < this.lineStart) {
        console.log("scroll up", this.lineStart, textLine)
        this.scrollUp(this.lineStart - textLine);
      }
    }
  }
  