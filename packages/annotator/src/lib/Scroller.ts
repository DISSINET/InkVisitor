/**
 * Scroller is component which renders scrollbar with runner
 */
class Scroller {
  // container element
  element: HTMLDivElement;
  // runner element
  runner: HTMLDivElement;
  // for triggering scroll event from Scroller -> Canvas
  onChangeCb?: (percentage: number) => void;

  dragging: boolean = false;
  // mouse position when drag started
  runnerDragStart: number = 0;

  runnerClickRelPosition: number = 0;

  constructor(element: HTMLDivElement) {
    this.element = element;
    const runner = element.firstElementChild;
    if (!runner) {
      throw new Error("Runner for Scroller not found");
    }
    this.runner = runner as HTMLDivElement;

    this.element.onmousedown = this.onMouseDown.bind(this);
    this.runner.onmousedown = this.onRunnerMouseDown.bind(this);

    // this.element.onmousemove = this.onMouseMove.bind(this);
    // window.addEventListener("mouseup", this.onRunnerMouseUp.bind(this));
  }

  setRunnerSize(percentSize: number): void {
    this.runner.style.height = `${Math.min(100, percentSize)}%`;
  }

  // convert px value to percentage considering the available height of the runner
  pxToPercentage(px: number) {
    const availableHeight = this.element.clientHeight;
    const runnerHeight = this.runner.clientHeight;
    const newPosition = px / (availableHeight - runnerHeight);
    return newPosition * 100;
  }

  /**
   * update refreshed variables after triggered mouse event (scroll or mouse-click)
   * @param startLine
   * @param endLine
   * @param totalLines
   */
  update(startLine: number, endLine: number, totalLines: number) {
    const viewportLines = endLine - startLine + 1;
    const percentage = (startLine * 100) / (totalLines - viewportLines);

    const availableHeight =
      this.element.clientHeight - this.runner.clientHeight;
    this.runner.style["top"] = `${(availableHeight / 100) * percentage}px`;
  }

  /**
   * onRunnerMouseDown is handler for pressed mouse-key event on the runner element
   * @param e
   */
  onRunnerMouseDown(e: MouseEvent) {
    e.stopPropagation();
    this.dragging = true;
    document.body.style.cursor = "move";
    this.runnerDragStart = e.clientY;

    this.runnerClickRelPosition =
      e.clientY - this.runner.getBoundingClientRect().top;

    document.addEventListener("mousemove", this.onMouseMove.bind(this));
    document.addEventListener("mouseup", this.onRunnerMouseUp.bind(this), {
      once: true,
    });
  }

  /**
   * onMouseMove is handler for mouse-move event on the wrapping element
   * @param e
   * @returns
   */
  onMouseMove(e: MouseEvent) {
    if (!this.dragging) {
      return;
    }

    if (this.onChangeCb) {
      // this.onChangeCb(newPosition);
      if (e.target !== this.runner && e.target !== this.element) {
        // outside the runner and scroller

        this.onChangeCb(
          this.pxToPercentage(
            e.clientY -
              this.runnerClickRelPosition -
              this.element.getBoundingClientRect().top
          )
        );
      } else if (e.target === this.runner) {
        // clicking inside runner

        const moveD = e.offsetY - this.runnerClickRelPosition;

        this.onChangeCb(
          this.pxToPercentage(
            this.runner.getBoundingClientRect().top +
              moveD -
              this.element.getBoundingClientRect().top
          )
        );
      } else {
        // clicking in the scroller
        this.onChangeCb(
          this.pxToPercentage(
            e.clientY -
              this.runnerClickRelPosition -
              this.element.getBoundingClientRect().top
          )
        );
      }
    }
  }

  /**
   * onRunnerMouseUp is handler for released mouse-key event on the runner element
   * @param e
   */
  onRunnerMouseUp(e: MouseEvent) {
    e.stopPropagation();
    if (!this.dragging) {
      return;
    }

    this.dragging = false;
    document.body.style.cursor = "initial";

    document.removeEventListener("mousemove", this.onMouseMove.bind(this));
  }

  /**
   * onMouseDown is handler for pressed mouse-key event on the wrapper element.
   * Clicking on the wrapper outside the runner triggers scroll event which triggers Scroller.update call.
   * @param e
   */
  onMouseDown(e: MouseEvent) {
    const availableHeight = this.element.clientHeight;
    if (this.onChangeCb) {
      this.onChangeCb((e.offsetY * 100) / availableHeight);
    }
  }

  /**
   * onChange stores callback for internally triggered scroll event (see onMouseDown)
   * @param cb
   */
  onChange(cb: (percentage: number) => void) {
    this.onChangeCb = cb;
  }
}

export default Scroller;
