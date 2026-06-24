/**
 * #2487 — SettingsOverlay gains a "select" (dropdown) control, used for the
 * proportional font-family picker in the Options modal.
 */
import { SettingsOverlay } from "./lib/SettingsOverlay";

const canvas = () => {
  const c = document.createElement("canvas");
  c.style.width = "800px";
  c.style.height = "600px";
  document.body.appendChild(c);
  return c;
};

describe("SettingsOverlay select control", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("renders a <select> with the given options and the current value selected", () => {
    const overlay = new SettingsOverlay();
    overlay.open(
      [
        {
          type: "select",
          label: "Font family",
          options: [
            { label: "Roboto", value: '"Roboto", sans-serif' },
            { label: "Serif", value: "Georgia, serif" },
          ],
          value: "Georgia, serif",
          onChange: () => {},
        },
      ],
      canvas(),
    );

    const select = document.querySelector("select") as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      '"Roboto", sans-serif',
      "Georgia, serif",
    ]);
    expect(select.value).toBe("Georgia, serif");
  });

  test("fires onChange with the chosen value", () => {
    const overlay = new SettingsOverlay();
    let chosen = "";
    overlay.open(
      [
        {
          type: "select",
          label: "Font family",
          options: [
            { label: "Roboto", value: '"Roboto", sans-serif' },
            { label: "Serif", value: "Georgia, serif" },
          ],
          value: '"Roboto", sans-serif',
          onChange: (v) => {
            chosen = v;
          },
        },
      ],
      canvas(),
    );

    const select = document.querySelector("select") as HTMLSelectElement;
    select.value = "Georgia, serif";
    select.dispatchEvent(new Event("change"));
    expect(chosen).toBe("Georgia, serif");
  });
});
