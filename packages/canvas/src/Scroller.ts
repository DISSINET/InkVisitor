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
  dragStart: any;

  constructor(element: HTMLDivElement) {
    this.element = element;
    const runner = element.firstElementChild;
    if (!runner) {
      throw new Error("Runner for Scroller not found");
    }
    this.runner = runner as HTMLDivElement;
    this.element.onmousedown = this.onMouseDown.bind(this);
    this.runner.onmousedown = this.onRunnerMouseDown.bind(this);
    this.element.onmousemove = this.onRunnerMouseMove.bind(this);
    window.addEventListener('mouseup', this.onRunnerMouseUp.bind(this))

  setRunnerSize(percentSize: number): void {
    this.runner.style.height = `${percentSize}%`;
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
    this.dragStart = this.runner.offsetTop;
  }

  onRunnerMouseMove(e: MouseEvent) {
    if (!this.dragging) {
      return
    }

    this.dragStart += e.movementY

    const availableHeight = this.element.clientHeight;
    if (this.onChangeCb) {
      this.onChangeCb(((this.dragStart) * 100) / availableHeight);
    }
  }

  /**
   * onRunnerMouseUp is handler for released mouse-key event on the runner element
   * @param e
   */
  onRunnerMouseUp(e: MouseEvent) {
    e.stopPropagation();
    if (!this.dragging) {
      return
    }

    this.dragging = false;
    const availableHeight = this.element.clientHeight;
    if (this.onChangeCb) {
      this.onChangeCb((e.offsetY * 100) / availableHeight);
    }
    this.dragStart = undefined;
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
