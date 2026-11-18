import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import { render, Rendered } from "pages/Geocoding/utils/test/renderForTest";
import React, { act } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { EntitySuggestion } from "types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Suggester } from "./Suggester";

const row = (id: string, label: string): EntitySuggestion => ({
  entity: {
    id,
    class: EntityEnums.Class.Person,
    labels: [label],
    status: EntityEnums.Status.Approved,
  } as IEntity,
  icons: [],
});

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
});

const key = (target: EventTarget, name: string) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true }));
  });

describe("Suggester", () => {
  it("picks the highlighted pre-suggestion on Enter", () => {
    const onPick = vi.fn();
    view = render(
      <Provider store={store}>
        <QueryClientProvider client={new QueryClient()}>
          <DndProvider backend={HTML5Backend}>
            <MemoryRouter>
              <SearchParamsProvider>
                <Suggester
                  suggestions={[]}
                  preSuggestions={[row("p1", "Peter"), row("p2", "Paul")]}
                  typed=""
                  category={EntityEnums.Class.Person}
                  categories={[{ value: EntityEnums.Class.Person, label: "P" }]}
                  onType={() => {}}
                  onChangeCategory={() => {}}
                  onCreate={() => {}}
                  onPick={onPick}
                  onDrop={() => {}}
                  onHover={() => {}}
                  onCancel={() => {}}
                  isInsideTemplate={false}
                  showCreateModal={false}
                  setShowCreateModal={() => {}}
                />
              </SearchParamsProvider>
            </MemoryRouter>
          </DndProvider>
        </QueryClientProvider>
      </Provider>
    );

    const input = view.one("input[type=text]") as HTMLInputElement;
    act(() => input.focus());
    key(window, "ArrowDown");
    key(input, "Enter");

    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: "p1" }));
  });
});
