/**
 * Lightweight right-click context menu for the annotator.
 *
 * The editor renders to a canvas, so a real menu can't live "inside" it — this
 * builds a small absolutely-positioned DOM overlay instead. It is self-contained
 * (no host wiring needed) and closes on outside-click, Escape, scroll, or blur.
 */

export interface ContextMenuItem {
  /** Text shown for the row. Ignored when `separator` is true. */
  label?: string;
  /** Invoked on click; the menu closes automatically afterwards. */
  onClick?: () => void;
  /** Render a horizontal divider instead of a clickable row. */
  separator?: boolean;
  /** Greyed-out, non-interactive row. */
  disabled?: boolean;
}

export class ContextMenu {
  private el: HTMLDivElement | null = null;

  /** Whether the menu is currently shown. */
  get isOpen(): boolean {
    return this.el !== null;
  }

  /**
   * Open the menu at the given viewport coordinates (e.g. MouseEvent.clientX/Y).
   * Any previously-open menu is replaced.
   */
  open(clientX: number, clientY: number, items: ContextMenuItem[]): void {
    this.close();

    const menu = document.createElement("div");
    Object.assign(menu.style, {
      position: "fixed",
      left: `${clientX}px`,
      top: `${clientY}px`,
      zIndex: "200",
      minWidth: "160px",
      padding: "4px",
      background: "#ffffff",
      border: "1px solid #d0d0d0",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      font: '13px "Roboto", sans-serif',
      color: "#222",
      userSelect: "none",
    } as Partial<CSSStyleDeclaration>);

    for (const item of items) {
      if (item.separator) {
        const sep = document.createElement("div");
        Object.assign(sep.style, {
          height: "1px",
          margin: "4px 0",
          background: "#e0e0e0",
        } as Partial<CSSStyleDeclaration>);
        menu.appendChild(sep);
        continue;
      }

      const row = document.createElement("div");
      row.textContent = item.label ?? "";
      Object.assign(row.style, {
        padding: "5px 14px",
        cursor: item.disabled ? "default" : "pointer",
        color: item.disabled ? "#aaa" : "inherit",
        whiteSpace: "nowrap",
        borderRadius: "4px",
        transition: "background-color 0.2s ease",
      } as Partial<CSSStyleDeclaration>);

      if (!item.disabled) {
        row.addEventListener("mouseenter", () => {
          row.style.background = "#CCD5F4";
        });
        row.addEventListener("mouseleave", () => {
          row.style.background = "transparent";
        });
        row.addEventListener("mousedown", (e) => {
          // mousedown (not click) so we fire before the outside-click handler.
          e.preventDefault();
          e.stopPropagation();
          this.close();
          item.onClick?.();
        });
      }

      menu.appendChild(row);
    }

    document.body.appendChild(menu);
    this.el = menu;

    // Keep the menu inside the viewport if it would overflow the edges.
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${Math.max(0, window.innerWidth - rect.width)}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${Math.max(0, window.innerHeight - rect.height)}px`;
    }

    document.addEventListener("mousedown", this.onOutsidePointer, true);
    document.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("blur", this.onDismiss);
    window.addEventListener("resize", this.onDismiss);
    document.addEventListener("scroll", this.onDismiss, true);
  }

  /** Remove the menu and detach all listeners. Safe to call when already closed. */
  close(): void {
    if (!this.el) {
      return;
    }
    this.el.remove();
    this.el = null;

    document.removeEventListener("mousedown", this.onOutsidePointer, true);
    document.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("blur", this.onDismiss);
    window.removeEventListener("resize", this.onDismiss);
    document.removeEventListener("scroll", this.onDismiss, true);
  }

  private readonly onOutsidePointer = (e: MouseEvent) => {
    if (this.el && !this.el.contains(e.target as Node)) {
      this.close();
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this.close();
    }
  };

  private readonly onDismiss = () => this.close();
}
