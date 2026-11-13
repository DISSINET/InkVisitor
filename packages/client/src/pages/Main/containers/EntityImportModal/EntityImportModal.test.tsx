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

const buttonNamed = (label: string) =>
  [...document.querySelectorAll("button")].find((button) => button.textContent === label)!;

const pasteAndValidate = async (input: unknown) => {
  const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  await act(async () => {
    setValue.call(textarea, JSON.stringify(input));
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => buttonNamed("Validate").click());
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
    await act(async () => buttonNamed("Import 1 entity").click());
    await act(async () => buttonNamed("Cancel").click());
    expect(closeModal).toHaveBeenCalled();

    await act(async () => answerCheck({ data: [] }));

    expect(entityCreate).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
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
    await act(async () => buttonNamed("append to it").click());
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

    await act(async () => buttonNamed("Close").click());
    expect(closeModal).toHaveBeenCalled();
  });
});
