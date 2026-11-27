import { EntityEnums } from "@inkvisitor/shared/enums";
import { IResponseDetail, IResponseUsedInDocument } from "@inkvisitor/shared/types/response-detail";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { ThemeProvider } from "styled-components";
import theme from "Theme/theme";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntityDetailUsedInDocumentsTable } from "./EntityDetailUsedInDocumentsTable";

// the table renders with no server behind it; logged out, the anchor text
// fetches nothing on hover
vi.mock("api", () => ({ default: { isLoggedIn: () => false } }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const use = (over: Partial<IResponseUsedInDocument>): IResponseUsedInDocument => ({
  document: { id: "d1", title: "Doc", createdAt: new Date(0), updatedAt: new Date(0) },
  anchorText: "",
  resourceId: "",
  parentTerritoryId: "",
  anchorIndex: 0,
  ...over,
});

describe("EntityDetailUsedInDocumentsTable", () => {
  let container: HTMLDivElement;
  let root: Root;

  const rows = (uses: IResponseUsedInDocument[]) => {
    const entity = {
      id: "e1",
      class: EntityEnums.Class.Concept,
      entities: {},
      usedInDocuments: uses,
    } as unknown as IResponseDetail;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <QueryClientProvider client={new QueryClient()}>
              <MemoryRouter>
                <SearchParamsProvider>
                  <EntityDetailUsedInDocumentsTable
                    title={{ singular: "Anchor", plural: "Anchors" }}
                    entity={entity}
                    widthTooNarrow={false}
                  />
                </SearchParamsProvider>
              </MemoryRouter>
            </QueryClientProvider>
          </ThemeProvider>
        </Provider>
      );
    });
    return Array.from(container.querySelectorAll("tbody tr"));
  };

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("marks an orphaned anchor as broken and offers no removal for it", () => {
    const [orphaned, paired] = rows([
      use({ orphaned: true }),
      use({ anchorText: "paired", anchorIndex: 1 }),
    ]);

    expect(orphaned.textContent).toContain("broken anchor");
    expect(paired.textContent).toContain("paired");
    expect(paired.textContent).not.toContain("broken anchor");
    expect([orphaned, paired].map((row) => row.querySelector("td:last-child button") !== null)).toEqual([
      false,
      true,
    ]);
  });
});
