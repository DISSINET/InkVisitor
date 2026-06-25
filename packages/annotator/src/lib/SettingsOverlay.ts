import { MenuColors, LIGHT_MENU_COLORS } from "./constants";

/**
 * Modal settings overlay for the annotator.
 *
 * Like ContextMenu, the editor renders to a canvas, so this builds a centered
 * DOM box on top of a dimmed backdrop. It is self-contained (no host wiring) and
 * closes on backdrop click, the × button, or Escape.
 *
 * Settings are passed in as a small declarative schema (currently just a
 * segmented control); add new control types here as the options grow.
 */

/** A single-choice segmented control (e.g. caret width: 1px / 2px / 3px). */
export interface SegmentedSetting {
  type: "segmented";
  label: string;
  options: { label: string; value: number }[];
  /** Currently-selected value (must match one of `options[].value`). */
  value: number;
  onChange: (value: number) => void;
}

/** A native color picker (`<input type="color">`). */
export interface ColorSetting {
  type: "color";
  label: string;
  /** Current color as a `#rrggbb` hex string. */
  value: string;
  onChange: (hex: string) => void;
}

/** A single-choice dropdown (`<select>`), e.g. font family. String-valued. */
export interface SelectSetting {
  type: "select";
  label: string;
  options: { label: string; value: string }[];
  /** Currently-selected value (must match one of `options[].value`). */
  value: string;
  onChange: (value: string) => void;
}

export type SettingControl = SegmentedSetting | ColorSetting | SelectSetting;

/** A button rendered in the overlay footer (e.g. "Reset to defaults"). */
export interface FooterAction {
  label: string;
  onClick: () => void;
}

export class SettingsOverlay {
  private backdrop: HTMLDivElement | null = null;
  /** Canvas the backdrop is anchored to; followed each frame while open. */
  private anchor: HTMLElement | null = null;
  /** Pending requestAnimationFrame id for the anchor-follow loop. */
  private followRaf: number | null = null;
  /** Last anchor rect applied, so the follow loop only writes on change. */
  private lastRect: { left: number; top: number; width: number; height: number } | null = null;

  /** Whether the overlay is currently shown. */
  get isOpen(): boolean {
    return this.backdrop !== null;
  }

  /**
   * Show the overlay with the given settings. A previously-open instance is
   * replaced. When `anchor` is given the backdrop covers only that element's
   * box (e.g. the canvas) instead of the whole viewport.
   */
  private colors: MenuColors = LIGHT_MENU_COLORS;

  open(settings: SettingControl[] = [], anchor?: HTMLElement, footer: FooterAction[] = [], colors?: MenuColors): void {
    if (colors) this.colors = colors;
    this.close();

    const backdrop = document.createElement("div");
    Object.assign(backdrop.style, {
      position: "fixed",
      zIndex: "10",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.35)",
    } as Partial<CSSStyleDeclaration>);

    this.anchor = anchor ?? null;
    if (anchor) {
      (backdrop.style as Partial<CSSStyleDeclaration>).overflow = "hidden";
      this.applyAnchorRect(backdrop, anchor);
    } else {
      (backdrop.style as Partial<CSSStyleDeclaration>).inset = "0";
    }

    const box = document.createElement("div");
    Object.assign(box.style, {
      maxWidth: "90%",
      maxHeight: "90%",
      overflow: "auto",
      background: this.colors.bg,
      border: `1px solid ${this.colors.border}`,
      borderRadius: "6px",
      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.25)",
      font: '13px "Roboto", sans-serif',
      color: this.colors.text,
    } as Partial<CSSStyleDeclaration>);
    // Clicks inside the box must not fall through to the backdrop dismiss.
    box.addEventListener("mousedown", (e) => e.stopPropagation());

    box.appendChild(this.buildHeader());

    const body = document.createElement("div");
    Object.assign(body.style, {
      padding: "16px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    } as Partial<CSSStyleDeclaration>);

    if (settings.length === 0) {
      body.textContent = "No settings yet.";
      (body.style as Partial<CSSStyleDeclaration>).color = this.colors.disabled;
    } else {
      for (const setting of settings) {
        body.appendChild(
          setting.type === "color"
            ? this.buildColor(setting)
            : setting.type === "select"
            ? this.buildSelect(setting)
            : this.buildSegmented(setting)
        );
      }
    }

    box.appendChild(body);

    if (footer.length > 0) {
      box.appendChild(this.buildFooter(footer));
    }

    backdrop.appendChild(box);
    backdrop.addEventListener("mousedown", () => this.close());

    document.body.appendChild(backdrop);
    this.backdrop = backdrop;

    // Follow the anchor every frame so the backdrop tracks the canvas while a
    // panel spring-animates (the canvas drifts after the one-shot resize event).
    if (this.anchor) {
      this.startFollow();
    }

    document.addEventListener("keydown", this.onKeyDown, true);
  }

  /** Apply the anchor's current viewport rect to the backdrop, caching it. */
  private applyAnchorRect(backdrop: HTMLDivElement, anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    if (
      this.lastRect &&
      this.lastRect.left === rect.left &&
      this.lastRect.top === rect.top &&
      this.lastRect.width === rect.width &&
      this.lastRect.height === rect.height
    ) {
      return;
    }
    this.lastRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    Object.assign(backdrop.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    } as Partial<CSSStyleDeclaration>);
  }

  /** Re-read the anchor rect each animation frame until the overlay closes. */
  private startFollow(): void {
    const tick = () => {
      if (!this.backdrop || !this.anchor) {
        this.followRaf = null;
        return;
      }
      this.applyAnchorRect(this.backdrop, this.anchor);
      this.followRaf = requestAnimationFrame(tick);
    };
    this.followRaf = requestAnimationFrame(tick);
  }

  /** Remove the overlay and detach listeners. Safe to call when already closed. */
  close(): void {
    if (!this.backdrop) {
      return;
    }
    if (this.followRaf !== null) {
      cancelAnimationFrame(this.followRaf);
      this.followRaf = null;
    }
    this.anchor = null;
    this.lastRect = null;
    this.backdrop.remove();
    this.backdrop = null;
    document.removeEventListener("keydown", this.onKeyDown, true);
  }

  /**
   *  Re-anchor the backdrop to the canvas. No-op when closed. Kept for callers
   *  that drive a resize explicitly; the per-frame follow loop covers the rest.
   */
  reposition(anchor: HTMLElement): void {
    if (!this.backdrop) {
      return;
    }
    this.applyAnchorRect(this.backdrop, anchor);
  }

  private buildHeader(): HTMLDivElement {
    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderBottom: `1px solid ${this.colors.separator}`,
      fontWeight: "bold",
    } as Partial<CSSStyleDeclaration>);

    const title = document.createElement("span");
    title.textContent = "Options";

    const closeBtn = document.createElement("span");
    closeBtn.textContent = "×";
    Object.assign(closeBtn.style, {
      cursor: "pointer",
      padding: "0 4px",
      fontSize: "18px",
      lineHeight: "1",
    } as Partial<CSSStyleDeclaration>);
    closeBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    return header;
  }

  /** Render the footer with action buttons (e.g. "Reset to defaults"). */
  private buildFooter(actions: FooterAction[]): HTMLDivElement {
    const footer = document.createElement("div");
    Object.assign(footer.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      padding: "10px 14px",
      borderTop: `1px solid ${this.colors.separator}`,
    } as Partial<CSSStyleDeclaration>);

    for (const action of actions) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.label;
      Object.assign(btn.style, {
        font: "inherit",
        padding: "5px 12px",
        border: `1px solid ${this.colors.border}`,
        borderRadius: "4px",
        background: this.colors.buttonBg,
        color: this.colors.text,
        cursor: "pointer",
      } as Partial<CSSStyleDeclaration>);
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        action.onClick();
      });
      footer.appendChild(btn);
    }

    return footer;
  }

  /** A labelled setting row: `<label>` on the left, control on the right. */
  private buildRow(labelText: string): { row: HTMLDivElement; label: HTMLSpanElement } {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
    } as Partial<CSSStyleDeclaration>);

    const label = document.createElement("span");
    label.textContent = labelText;
    row.appendChild(label);
    return { row, label };
  }

  /** Render a labelled native color picker; picking a color fires onChange. */
  private buildColor(setting: ColorSetting): HTMLDivElement {
    const { row } = this.buildRow(setting.label);

    const input = document.createElement("input");
    input.type = "color";
    input.value = setting.value;
    Object.assign(input.style, {
      width: "40px",
      height: "24px",
      padding: "0",
      border: `1px solid ${this.colors.border}`,
      borderRadius: "4px",
      cursor: "pointer",
      background: "none",
    } as Partial<CSSStyleDeclaration>);
    // Keep clicks inside the control from dismissing the backdrop.
    input.addEventListener("mousedown", (e) => e.stopPropagation());
    input.addEventListener("input", () => setting.onChange(input.value));

    row.appendChild(input);
    return row;
  }

  /** Render a labelled dropdown; choosing an option fires onChange. */
  private buildSelect(setting: SelectSetting): HTMLDivElement {
    const { row } = this.buildRow(setting.label);

    const select = document.createElement("select");
    Object.assign(select.style, {
      padding: "4px 8px",
      border: `1px solid ${this.colors.border}`,
      borderRadius: "4px",
      background: this.colors.bg,
      color: this.colors.text,
      cursor: "pointer",
      outline: "none",
    } as Partial<CSSStyleDeclaration>);

    for (const opt of setting.options) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }
    select.value = setting.value;

    // Keep interactions inside the control from dismissing the backdrop.
    select.addEventListener("mousedown", (e) => e.stopPropagation());
    select.addEventListener("change", () => setting.onChange(select.value));

    row.appendChild(select);
    return row;
  }

  /** Render a labelled segmented control; clicking a segment fires onChange. */
  private buildSegmented(setting: SegmentedSetting): HTMLDivElement {
    const { row } = this.buildRow(setting.label);

    const group = document.createElement("div");
    Object.assign(group.style, {
      display: "inline-flex",
      border: `1px solid ${this.colors.border}`,
      borderRadius: "4px",
      overflow: "hidden",
    } as Partial<CSSStyleDeclaration>);

    let selected = setting.value;
    const segments: { value: number; el: HTMLElement }[] = [];

    const restyle = () => {
      for (const seg of segments) {
        const active = seg.value === selected;
        Object.assign(seg.el.style, {
          background: active ? this.colors.accent : this.colors.bg,
          color: active ? this.colors.accentText : this.colors.text,
        } as Partial<CSSStyleDeclaration>);
      }
    };

    for (const opt of setting.options) {
      const seg = document.createElement("div");
      seg.textContent = opt.label;
      Object.assign(seg.style, {
        padding: "4px 12px",
        cursor: "pointer",
        borderLeft: segments.length ? `1px solid ${this.colors.border}` : "none",
      } as Partial<CSSStyleDeclaration>);
      seg.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selected = opt.value;
        restyle();
        setting.onChange(opt.value);
      });
      segments.push({ value: opt.value, el: seg });
      group.appendChild(seg);
    }

    restyle();

    row.appendChild(group);
    return row;
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      this.close();
    }
  };
}
