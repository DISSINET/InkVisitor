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
const { entitiesGet, entityCreate } = vi.hoisted(() => ({
  entitiesGet: vi.fn(async () => ({ data: [] })),
  entityCreate: vi.fn(async () => ({ data: { result: true } })),
}));
vi.mock("api", () => {
  const answer = async () => ({ data: [] });
  const calls: Record<string, unknown> = { entitiesGet, entityCreate, isLoggedIn: () => true };
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
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(textarea, JSON.stringify({ class: "C", labels: ["TEST dog"] }));
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => buttonNamed("Validate").click());
    expect(buttonNamed("Create 1 entity")).toBeDefined();

    // Create: the check waits on the server, and the modal is closed meanwhile
    let answerCheck: (value: { data: never[] }) => void = () => {};
    entitiesGet.mockImplementationOnce(() => new Promise((resolve) => (answerCheck = resolve)));
    await act(async () => buttonNamed("Create 1 entity").click());
    await act(async () => buttonNamed("Cancel").click());
    expect(closeModal).toHaveBeenCalled();

    await act(async () => answerCheck({ data: [] }));

    expect(entityCreate).not.toHaveBeenCalled();
    expect(onImported).not.toHaveBeenCalled();
  });
});
