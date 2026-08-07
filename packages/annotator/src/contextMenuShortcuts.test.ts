import { Annotator } from "./lib/Annotator";
import { EditMode } from "./lib/constants";
import {
  SHORTCUT_OPTIONS,
  SHORTCUT_PARAGRAPH_MARKS,
  matchesShortcut,
  shortcutLabel,
} from "./lib/shortcuts";

const mk = (text: string): Annotator => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  const a = new Annotator(c, text);
  a.setMode(EditMode.RAW);
  return a;
};

const keyEvent = (init: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    code: "",
    key: "",
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    preventDefault: () => {},
    ...init,
  }) as KeyboardEvent;

describe("context-menu shortcuts", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("labels follow the platform's modifier notation", () => {
    expect(shortcutLabel(SHORTCUT_PARAGRAPH_MARKS, true)).toBe("⇧⌘8");
    expect(shortcutLabel(SHORTCUT_PARAGRAPH_MARKS, false)).toBe("Ctrl+Shift+8");
    expect(shortcutLabel(SHORTCUT_OPTIONS, true)).toBe("⌘,");
    expect(shortcutLabel(SHORTCUT_OPTIONS, false)).toBe("Ctrl+,");
  });

  test("the primary modifier is the platform's, and the other one does not stand in", () => {
    const shiftDigit8 = { code: "Digit8", shiftKey: true, altKey: false };

    expect(
      matchesShortcut(
        { ...shiftDigit8, metaKey: true, ctrlKey: false },
        SHORTCUT_PARAGRAPH_MARKS,
        true,
      ),
    ).toBe(true);
    expect(
      matchesShortcut(
        { ...shiftDigit8, metaKey: false, ctrlKey: true },
        SHORTCUT_PARAGRAPH_MARKS,
        true,
      ),
    ).toBe(false);
    expect(
      matchesShortcut(
        { ...shiftDigit8, metaKey: false, ctrlKey: true },
        SHORTCUT_PARAGRAPH_MARKS,
        false,
      ),
    ).toBe(true);
  });

  test("Shift+8 without the primary modifier is plain typing", () => {
    expect(
      matchesShortcut(
        { code: "Digit8", shiftKey: true, altKey: false, ctrlKey: false, metaKey: false },
        SHORTCUT_PARAGRAPH_MARKS,
        false,
      ),
    ).toBe(false);
  });

  test("menu rows carry their shortcut", () => {
    const a = mk("foo bar");
    a.onContextMenu({
      clientX: 10,
      clientY: 10,
      preventDefault: () => {},
    } as MouseEvent);

    const text = document.body.textContent ?? "";
    expect(text).toContain(shortcutLabel(SHORTCUT_PARAGRAPH_MARKS));
    expect(text).toContain(shortcutLabel(SHORTCUT_OPTIONS));
    a.contextMenu.close();
  });

  // Both modifier variants are pressed in the two cases below: exactly the one
  // matching the platform fires, which holds wherever the suite runs.
  test("the paragraph-marks shortcut toggles the marks without editing the text", () => {
    const a = mk("foo bar");
    const spy = jest.spyOn(a, "toggleParagraphMarks");

    a.keys.onKeyDown(
      keyEvent({ code: "Digit8", key: "*", shiftKey: true, ctrlKey: true }),
    );
    a.keys.onKeyDown(
      keyEvent({ code: "Digit8", key: "*", shiftKey: true, metaKey: true }),
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(a.text.value).toBe("foo bar");
  });

  test("the options shortcut opens the settings overlay", () => {
    const a = mk("foo bar");
    expect(a.settingsOverlay.isOpen).toBe(false);

    a.keys.onKeyDown(keyEvent({ code: "Comma", key: ",", ctrlKey: true }));
    a.keys.onKeyDown(keyEvent({ code: "Comma", key: ",", metaKey: true }));

    expect(a.settingsOverlay.isOpen).toBe(true);
    expect(a.text.value).toBe("foo bar");
    a.settingsOverlay.close();
  });
});
