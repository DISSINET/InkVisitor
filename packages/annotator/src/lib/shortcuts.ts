/**
 * Keyboard shortcuts for the annotator's context-menu commands.
 *
 * A shortcut is declared once here and used twice: {@link shortcutLabel} renders
 * it in the menu, {@link matchesShortcut} recognises it in the key handler, so
 * the two can never drift apart.
 */

/** Modifier that pairs with a letter/digit for app commands on this platform. */
export type PrimaryModifier = "meta" | "ctrl";

export interface Shortcut {
  /** Requires the platform's primary modifier (⌘ on macOS, Ctrl elsewhere). */
  primary?: boolean;
  shift?: boolean;
  alt?: boolean;
  /**
   * Physical key, as KeyboardEvent.code. Matching on `code` rather than `key`
   * survives the modifiers rewriting the character (Shift+8 arrives as "*").
   */
  code: string;
  /** Character shown in the menu, e.g. "8" for Digit8. */
  display: string;
}

export const isMacPlatform = (): boolean =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

export const SHORTCUT_COPY: Shortcut = { primary: true, code: "KeyC", display: "C" };
export const SHORTCUT_PASTE: Shortcut = { primary: true, code: "KeyV", display: "V" };
/** Word's formatting-marks shortcut. */
export const SHORTCUT_PARAGRAPH_MARKS: Shortcut = {
  primary: true,
  shift: true,
  code: "Digit8",
  display: "8",
};
/** The platform convention for opening an application's preferences. */
export const SHORTCUT_OPTIONS: Shortcut = { primary: true, code: "Comma", display: "," };

/**
 * Human-readable form of a shortcut: the macOS glyph run (⇧⌘8) or the
 * Windows/Linux spelled-out chain (Ctrl+Shift+8).
 */
export const shortcutLabel = (shortcut: Shortcut, isMac = isMacPlatform()): string => {
  if (isMac) {
    // Apple's fixed modifier order, innermost last: ⌃⌥⇧⌘
    return `${shortcut.alt ? "⌥" : ""}${shortcut.shift ? "⇧" : ""}${
      shortcut.primary ? "⌘" : ""
    }${shortcut.display}`;
  }
  const parts: string[] = [];
  if (shortcut.primary) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.display);
  return parts.join("+");
};

/**
 * Whether a key event is this shortcut. The primary modifier is the platform's
 * (⌘ / Ctrl), and the other one must be absent so that e.g. Ctrl+⌘+, on macOS
 * is left to the system.
 */
export const matchesShortcut = (
  e: Pick<KeyboardEvent, "code" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey">,
  shortcut: Shortcut,
  isMac = isMacPlatform(),
): boolean => {
  if (e.code !== shortcut.code) {
    return false;
  }
  if (shortcut.primary) {
    const primaryHeld = isMac ? e.metaKey : e.ctrlKey;
    const otherHeld = isMac ? e.ctrlKey : e.metaKey;
    if (!primaryHeld || otherHeld) {
      return false;
    }
  } else if (e.metaKey || e.ctrlKey) {
    return false;
  }
  return e.shiftKey === !!shortcut.shift && e.altKey === !!shortcut.alt;
};
