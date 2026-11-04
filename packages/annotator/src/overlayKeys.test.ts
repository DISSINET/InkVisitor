/**
 * Keys the annotator's overlays and canvas must not keep from, or pass on to,
 * the page around them: a modal hosting the annotator listens for Escape on the
 * window, and macOS keeps Ctrl+Cmd combos for itself.
 */
import { Annotator } from "./lib/Annotator";
import { ContextMenu } from "./lib/ContextMenu";
import { EditMode } from "./lib/constants";
import { SettingsOverlay } from "./lib/SettingsOverlay";

const canvas = () => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return c;
};

const pressEscape = () =>
  document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

describe("annotator overlay keys", () => {
  const onWindowKeyDown = jest.fn();

  beforeEach(() => window.addEventListener("keydown", onWindowKeyDown));

  afterEach(() => {
    window.removeEventListener("keydown", onWindowKeyDown);
    onWindowKeyDown.mockClear();
    document.body.innerHTML = "";
  });

  test("Escape closes the settings overlay and goes no further", () => {
    const overlay = new SettingsOverlay();
    overlay.open([], canvas());

    pressEscape();

    expect(overlay.isOpen).toBe(false);
    expect(onWindowKeyDown).not.toHaveBeenCalled();
  });

  test("Escape closes the context menu and goes no further", () => {
    const menu = new ContextMenu();
    menu.open(10, 10, [{ label: "Copy", onClick: () => {} }]);

    pressEscape();

    expect(menu.isOpen).toBe(false);
    expect(onWindowKeyDown).not.toHaveBeenCalled();
  });

  test("Escape with no overlay open still reaches the window", () => {
    pressEscape();

    expect(onWindowKeyDown).toHaveBeenCalledTimes(1);
  });

  test("the focused canvas leaves Ctrl+Cmd combos to the system", () => {
    const c = canvas();
    const annotator = new Annotator(c, "text");
    annotator.setMode(EditMode.RAW);

    const fullScreen = new KeyboardEvent("keydown", {
      key: "f",
      code: "KeyF",
      ctrlKey: true,
      metaKey: true,
      cancelable: true,
    });
    c.dispatchEvent(fullScreen);

    expect(fullScreen.defaultPrevented).toBe(false);
  });
});
