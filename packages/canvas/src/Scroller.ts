class Scroller {
    element: HTMLDivElement;
    runner: HTMLDivElement;
    onChangeCb?: (percentage: number) => void;
  
    constructor(element: HTMLDivElement) {
      this.element = element;
      const runner = element.firstElementChild;
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
      const availableHeight = this.element.clientHeight - this.runner.clientHeight;
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

  export default Scroller;