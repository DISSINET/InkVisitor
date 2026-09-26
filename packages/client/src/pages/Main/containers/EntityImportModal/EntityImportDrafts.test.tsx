import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchParamsProvider } from "hooks/useSearchParamsContext";
import React, { act, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { createRoot, Root } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "redux/store";
import { ThemeProvider } from "styled-components";
import theme from "Theme/theme";
import { ImportDraft } from "utils/entityImport";
import { normalizeEntities } from "utils/entityImport/normalizeEntities";
import { EntityImportDrafts } from "./EntityImportDrafts";

// Detail renders with no server behind it: every api call answers empty
vi.mock("api", () => {
  const answer = async () => ({ data: [] });
  return {
    default: new Proxy(
      {},
      { get: (_target, key) => (key === "isLoggedIn" ? () => true : answer) }
    ),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const newEntity = (item: Record<string, unknown>) =>
  normalizeEntities([item], { defaultLanguage: EntityEnums.Language.English }).entities[0].entity;

const existingEntity = (id: string, entityClass: EntityEnums.Class) =>
  ({
    id,
    class: entityClass,
    labels: [id],
    detail: "",
    language: EntityEnums.Language.English,
    status: EntityEnums.Status.Approved,
    notes: [],
    props: [],
    references: [],
    data: {},
    isTemplate: false,
  }) as IEntity;

const initialDraft: ImportDraft = {
  entities: [
    newEntity({
      id: "dog",
      class: "C",
      labels: ["TEST dog"],
      props: [{ type: "size", value: "animal", children: [{ type: "size" }] }],
      references: [{ resource: "book", value: "page" }],
    }),
    newEntity({ id: "hit", class: "A", labels: ["TEST hit"] }),
    newEntity({ id: "folio", class: "T", labels: ["TEST folio"], data: { parent: { territoryId: "T0" } } }),
    newEntity({ id: "rex", class: "P", labels: ["TEST rex"], data: { logicalType: "1" } }),
  ],
  relations: [
    { id: "r1", type: RelationEnums.Type.Superclass, entityIds: ["dog", "animal"] },
    { id: "r2", type: RelationEnums.Type.Synonym, entityIds: ["dog", "hound"] },
    { id: "r3", type: RelationEnums.Type.Classification, entityIds: ["rex", "dog"] },
    { id: "r4", type: RelationEnums.Type.SubjectSemantics, entityIds: ["hit", "animal"] },
  ] as Relation.IRelation[],
  existing: Object.fromEntries(
    [
      existingEntity("animal", EntityEnums.Class.Concept),
      existingEntity("hound", EntityEnums.Class.Concept),
      existingEntity("size", EntityEnums.Class.Concept),
      existingEntity("book", EntityEnums.Class.Resource),
      existingEntity("page", EntityEnums.Class.Value),
      existingEntity("T0", EntityEnums.Class.Territory),
    ].map((entity) => [entity.id, entity])
  ),
};

let latestDraft: ImportDraft = initialDraft;
const closed: string[] = [];

const Harness = () => {
  const [draft, setDraft] = useState(initialDraft);
  latestDraft = draft;
  return (
    <EntityImportDrafts
      draft={draft}
      onDraftChange={(change) => setDraft((current) => change(current))}
      onCloseTab={(entityId) => closed.push(entityId)}
      onMoveTab={() => {}}
      errors={[]}
      notes={[{ message: "a note" }]}
    />
  );
};

describe("EntityImportDrafts", () => {
  let container: HTMLDivElement;
  let root: Root;

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
                    <Harness />
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

  const text = () => container.textContent ?? "";

  const openTab = async (label: string) => {
    // the tab label element also holds the class letter, so match its text node
    const tab = [...container.querySelectorAll("*")].find((element) =>
      [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent === label
      )
    ) as HTMLElement | undefined;
    expect(tab).toBeDefined();
    await act(async () => tab!.click());
  };

  it("shows every draft in Detail, without the parts a draft has no use for", async () => {
    expect(text()).toContain("TEST dog");
    expect(text()).toContain("Metaproperties");
    expect(text()).toContain("References");
    expect(text()).toContain("Relations");
    expect(text()).not.toContain("Used in");
    expect(text()).not.toContain("Audits");
    expect(text()).not.toContain("Apply Template");

    await openTab("TEST hit");
    expect(text()).toContain("Valency");
    // the subject semantics relation of the draft, in the valency section
    expect(text()).toContain("SUSSemanticsCanimal");

    await openTab("TEST folio");
    expect(text()).toContain("Parent Territory");
    expect(text()).toContain("Protocol");
    // validation rules are not imported
    expect(text()).not.toContain("Validation");

    await openTab("TEST rex");
    expect(text()).toContain("Logical Type");
    // a relation between two drafts shows on both
    expect(text()).toContain("TEST dog");
  });

  it("writes Detail's edits into the draft", async () => {
    const detail = [...container.querySelectorAll("textarea")].find(
      (element) => element.value === ""
    ) as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    await act(async () => {
      setValue.call(detail, "edited in the draft");
      detail.dispatchEvent(new Event("input", { bubbles: true }));
      detail.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      detail.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    });

    expect(latestDraft.entities[0].detail).toBe("edited in the draft");
  });
});
