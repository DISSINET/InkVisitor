import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import React, { act } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { ThemeProvider } from "styled-components";
import theme from "Theme/theme";
import { EntityImportModal } from "./EntityImportModal";

// the server behind the modal: every call answers empty, except the entity
// lookups, which the test answers when it wants
const { entitiesGet, entitiesSearch, entityCreate } = vi.hoisted(() => ({
  entitiesGet: vi.fn(async (_ids: string[]) => ({ data: [] as unknown[] })),
  entitiesSearch: vi.fn(async () => ({ data: [] as unknown[] })),
  entityCreate: vi.fn(async () => ({ data: { result: true } })),
}));
vi.mock("api", () => {
  const answer = async () => ({ data: [] });
  const calls: Record<string, unknown> = {
    entitiesGet,
    entitiesSearch,
    entityCreate,
    isLoggedIn: () => true,
  };
  return { default: new Proxy({}, { get: (_target, key: string) => calls[key] ?? answer }) };
});
vi.mock("hooks/react-query", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUserQuery: () => ({ data: { options: { defaultLanguage: "eng" } } }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
// the modal waits for a paint before it validates; a frame comes at once here
globalThis.requestAnimationFrame = (callback) => {
  callback(performance.now());
  return 0;
};

const buttonNamed = (label: string) =>
  [...document.querySelectorAll("button")].find((button) => button.textContent === label)!;

// the next task, by which the wait for a paint is over
const afterPaint = () => new Promise((resolve) => setTimeout(resolve));

// a click on a button that validates, and the validation up to its first
// unanswered server call
const clickValidating = (label: string) =>
  act(async () => {
    buttonNamed(label).click();
    await afterPaint();
  });

const pasteAndValidate = async (input: unknown) => {
  const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  await act(async () => {
    setValue.call(textarea, JSON.stringify(input));
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await clickValidating("Validate");
};

describe("EntityImportModal", () => {
  let container: HTMLDivElement;
  let root: Root;
  const closeModal = vi.fn();
  const onImported = vi.fn();

  beforeEach(async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => {
      root.render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={new QueryClient()}>
              <DndProvider backend={HTML5Backend}>
                <MemoryRouter>
                  <SearchParamsProvider>
                    <EntityImportModal closeModal={closeModal} onImported={onImported} />
                  </SearchParamsProvider>
                </MemoryRouter>
              </DndProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </Provider>
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("creates nothing when closed while Create still checks the drafts", async () => {
    // Validate: the input ids are free
    entitiesGet.mockResolvedValueOnce({ data: [] });
    await pasteAndValidate({ class: "C", labels: ["TEST dog"] });
    expect(buttonNamed("Import 1 entity")).toBeDefined();

    // Create: the check waits on the server, and the modal is closed meanwhile
    let answerCheck: (value: { data: never[] }) => void = () => {};
    entitiesGet.mockImplementationOnce(() => new Promise((resolve) => (answerCheck = resolve)));
    await clickValidating("Import 1 entity");
    await act(async () => buttonNamed("Cancel").click());
    expect(closeModal).toHaveBeenCalled();

    await act(async () => answerCheck({ data: [] }));

    expect(entityCreate).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });

  it("validates on Cmd+Enter in the JSON field", async () => {
    entitiesGet.mockResolvedValueOnce({ data: [] });
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(textarea, JSON.stringify({ class: "C", labels: ["TEST dog"] }));
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      textarea.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", metaKey: true, bubbles: true })
      );
      await afterPaint();
    });

    expect(buttonNamed("Import 1 entity")).toBeDefined();
  });

  it("opens the imported entities in Detail only when asked, Values left out", async () => {
    entitiesGet.mockResolvedValue({ data: [] });
    await pasteAndValidate([
      { class: "C", labels: ["TEST dog"] },
      { class: "V", labels: ["TEST small"] },
    ]);

    const box = document.querySelector(
      '[role="checkbox"][aria-label="open in Detail"]'
    ) as HTMLElement;
    expect(box.getAttribute("aria-checked")).toBe("false");
    await act(async () => box.click());
    expect(box.getAttribute("aria-checked")).toBe("true");

    await clickValidating("Import 2 entities");
    await act(afterPaint);
    expect(onImported).toHaveBeenCalledWith(expect.any(Array), 1);
  });

  it("undoes an append to a database entity, back to the new draft", async () => {
    const stored = {
      id: "stored-dog",
      class: "C",
      labels: ["TEST dog"],
      detail: "",
      language: "eng",
      notes: [],
      data: {},
      props: [],
      references: [],
      isTemplate: false,
      updatedAt: "t1",
    };
    entitiesSearch.mockResolvedValue({ data: [stored] });
    entitiesGet.mockImplementation(async (ids: string[]) => ({
      data: ids.includes(stored.id) ? [stored] : [],
    }));

    await pasteAndValidate({ class: "C", labels: ["TEST dog"], detail: "canine" });
    await clickValidating("append to it");
    expect(buttonNamed("undo append")).toBeDefined();

    await act(async () => buttonNamed("undo append").click());

    expect(buttonNamed("undo append")).toBeUndefined();
    expect(buttonNamed("append to it")).toBeDefined();
    expect(document.body.textContent).toContain('no longer appended to "TEST dog"');
  });

  it("asks before closing when the drafts were changed", async () => {
    closeModal.mockClear();
    entitiesGet.mockResolvedValue({ data: [] });
    await pasteAndValidate([
      { class: "C", labels: ["TEST dog"] },
      { class: "C", labels: ["TEST cat"] },
    ]);
    const leaveOut = document.querySelector(
      'button[aria-label="leave out of the import"]'
    ) as HTMLButtonElement;
    await act(async () => leaveOut.click());

    await act(async () => buttonNamed("Cancel").click());
    expect(closeModal).not.toHaveBeenCalled();
    await act(async () => buttonNamed("Keep editing").click());
    expect(closeModal).not.toHaveBeenCalled();

    await act(async () => buttonNamed("Cancel").click());
    await act(async () => buttonNamed("Discard changes and close").click());
    expect(closeModal).toHaveBeenCalled();
  });
});
