/**
 * Scroller is component which renders scrollbar with runner
 */
const MIN_RUNNER_HEIGHT_PX = 20;

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

  viewPortSize: number = 0;
  focusTarget?: HTMLElement;

  constructor(element: HTMLDivElement) {
    this.element = element;
    const runner = element.firstElementChild;
    if (!runner) {
      throw new Error("Runner for Scroller not found");
    }
    this.runner = runner as HTMLDivElement;

    this.element.onmousedown = this.onBarDown.bind(this);
    this.runner.onmousedown = this.onRunnerMouseDown.bind(this);

    // this.element.onmousemove = this.onMouseMove.bind(this);
    // window.addEventListener("mouseup", this.onRunnerMouseUp.bind(this));
  }

  setViewportSize(percentSize: number): void {
    this.viewPortSize = percentSize;
  }

  setFocusTarget(element: HTMLElement): void {
    this.focusTarget = element;
  }

  focusMainCanvas(): void {
    this.focusTarget?.focus({ preventScroll: true });
  }
  setRunnerSize(percentSize: number): void {
    const clampedPercent = Math.min(100, percentSize);
    const containerHeight = this.element.clientHeight;

    if (containerHeight > 0) {
      const minPercent = (MIN_RUNNER_HEIGHT_PX / containerHeight) * 100;
      const finalPercent = Math.max(clampedPercent, minPercent);
      this.runner.style.height = `${Math.min(100, finalPercent)}%`;
    } else {
      this.runner.style.height = `${clampedPercent}%`;
    }
  }

  // convert px value to percentage considering the available height of the runner
  pxToPercentage(px: number) {
    const availableHeight = this.element.clientHeight;
    const runnerHeight = this.runner.clientHeight;
    const newPosition = px / (availableHeight - runnerHeight);
    return newPosition * 100;
  }

  /**
   * update refreshed variables after triggered mouse event (scroll or mouse-click).
   * When scrollOffsetY and lineHeight are provided, the runner position reflects fluent (sub-line) scroll.
   * @param startLine
   * @param endLine
   * @param totalLines
   * @param scrollOffsetY optional pixel offset within the current line (fluent scroll)
   * @param lineHeight line height in same units as scrollOffsetY
   */
  update(
    startLine: number,
    endLine: number,
    totalLines: number,
    scrollOffsetY?: number,
    lineHeight?: number
  ) {
    const viewportLines = endLine - startLine;
    const scrollableLines = Math.max(0, totalLines - viewportLines);
    let percentage: number;
    if (scrollableLines <= 0) {
      percentage = 0;
    } else if (
      scrollOffsetY !== undefined &&
      lineHeight !== undefined &&
      lineHeight > 0
    ) {
      const scrollablePx = scrollableLines * lineHeight;
      const currentPx = startLine * lineHeight + scrollOffsetY;
      percentage = Math.min(100, Math.max(0, (currentPx / scrollablePx) * 100));
    } else {
      percentage = Math.min(
        100,
        (startLine * 100) / scrollableLines
      );
    }

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

    // remove anything from selection
    window.getSelection()?.removeAllRanges();

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

        this.onChangeCb(
          this.pxToPercentage(
            e.clientY -
              this.runnerClickRelPosition -
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
    this.focusMainCanvas();
  }

  /**
   * onMouseDown is handler for pressed mouse-key event on the wrapper element.
   * Clicking on the wrapper outside the runner triggers scroll event which triggers Scroller.update call.
   * @param e
   */
  onBarDown(e: MouseEvent) {
    if (this.onChangeCb) {
      const dPercents = this.viewPortSize;

      if (e.clientY < this.runner.getBoundingClientRect().top) {
        this.onChangeCb(
          Math.max(
            0,
            this.pxToPercentage(
              this.runner.getBoundingClientRect().top -
                this.element.getBoundingClientRect().top
            ) - dPercents
          )
        );
      } else {
        this.onChangeCb(
          Math.min(
            100,
            this.pxToPercentage(
              this.runner.getBoundingClientRect().top -
                this.element.getBoundingClientRect().top
            ) + dPercents
          )
        );
      }
    }
    this.focusMainCanvas();
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
