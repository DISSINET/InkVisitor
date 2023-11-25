/**
 * Viewpoer represents currently visible part of the rendered text
 */
export default class Viewport {
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
  
      if (textLine > this.lineStart) {
        console.log("scroll down", this.lineStart, textLine)
        this.scrollDown(textLine - this.lineStart, maxLines)
      } else if (textLine < this.lineStart) {
        console.log("scroll up", this.lineStart, textLine)
        this.scrollUp(this.lineStart - textLine);
      }
    }
  }
  