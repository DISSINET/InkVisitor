import { EntityEnums } from "@inkvisitor/shared/enums";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EntityEditingContext } from "hooks";
import React, { act } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { ThemeProvider } from "styled-components";
import theme from "Theme/theme";
import { EntityCreateModal } from "./EntityCreateModal";

const { entityCreate } = vi.hoisted(() => ({
  entityCreate: vi.fn(async () => ({ data: { result: true } })),
}));
vi.mock("api", () => {
  const answer = async () => ({ data: [] });
  const calls: Record<string, unknown> = { entityCreate, isLoggedIn: () => true };
  return { default: new Proxy({}, { get: (_target, key: string) => calls[key] ?? answer }) };
});
vi.mock("hooks/react-query", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useUserQuery: () => ({ data: { options: { defaultLanguage: "eng" } } }),
  useTemplatesQuery: () => ({ data: [] }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

describe("EntityCreateModal in the import's drafts", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("makes the new entity a draft and writes nothing to the database", async () => {
    const createDraft = vi.fn();
    const onMutationSuccess = vi.fn();
    const closeModal = vi.fn();
    await act(async () => {
      root.render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={new QueryClient()}>
              <DndProvider backend={HTML5Backend}>
                <MemoryRouter>
                  <EntityEditingContext.Provider
                    value={{
                      unstoredEntityIds: new Set(),
                      createsEntities: false,
                      offersStoredEntityFeatures: false,
                      createDraft,
                    }}
                  >
                    <EntityCreateModal
                      labelTyped="TEST new concept"
                      categorySelected={EntityEnums.Class.Concept}
                      closeModal={closeModal}
                      onMutationSuccess={onMutationSuccess}
                    />
                  </EntityEditingContext.Provider>
                </MemoryRouter>
              </DndProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </Provider>
      );
    });

    // a template instance would be written to the database at once
    expect(document.body.textContent).not.toContain("Apply Template");

    const create = [...document.querySelectorAll("button")].find(
      (button) => button.textContent === "Create"
    )!;
    await act(async () => create.click());

    expect(entityCreate).not.toHaveBeenCalled();
    expect(createDraft).toHaveBeenCalledWith(
      expect.objectContaining({ class: EntityEnums.Class.Concept, labels: ["TEST new concept"] })
    );
    expect(onMutationSuccess).toHaveBeenCalledWith(createDraft.mock.calls[0][0]);
    expect(closeModal).toHaveBeenCalled();
  });
});
