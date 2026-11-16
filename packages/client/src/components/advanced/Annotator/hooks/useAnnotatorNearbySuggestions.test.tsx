import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseStatement, IResponseTree } from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, Rendered } from "pages/Geocoding/utils/test/renderForTest";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAnnotatorNearbySuggestions } from "./useAnnotatorNearbySuggestions";

const { statementGet, territoryGet } = vi.hoisted(() => ({
  statementGet: vi.fn(),
  territoryGet: vi.fn(),
}));
vi.mock("api", () => ({ default: { isLoggedIn: () => true, statementGet, territoryGet } }));

// the ids "p<from>" to "p<to>"
const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `p${from + i}`);

// a statement in the T, with the persons of the ids as its actants
const statement = (id: string, territoryId: string, actantIds: string[]) =>
  ({
    id,
    class: EntityEnums.Class.Statement,
    props: [],
    data: {
      territory: { territoryId },
      actions: [],
      actants: actantIds.map((entityId) => ({
        entityId,
        props: [],
        classifications: [],
        identifications: [],
      })),
      tags: [],
    },
    entities: Object.fromEntries(
      actantIds.map((actantId) => [
        actantId,
        { id: actantId, class: EntityEnums.Class.Person, labels: [actantId] } as unknown as IEntity,
      ])
    ),
  }) as unknown as IResponseStatement;

const node = (id: string, path: string[], children: IResponseTree[] = []) =>
  ({ territory: { id }, path, statementsCount: 1, children }) as unknown as IResponseTree;

// root > book > ch, each with statements of its own
const tree = node("root", [], [node("book", ["root"], [node("ch", ["root", "book"])])]);

// the statement "s" is anchored over the selection
const anchors: IAnchorsNode[] = [
  {
    anchor: "s",
    class: EntityEnums.Class.Statement,
    content: "",
    indexStart: 0,
    indexEnd: 10,
    children: [],
  },
];

// the server answers with "s" and the statements of each T; a T left out
// answers as one the user can't read
const serve = (anchored: IResponseStatement, territories: Record<string, IResponseStatement[]>) => {
  statementGet.mockImplementation(async () => ({ data: anchored }));
  territoryGet.mockImplementation(async (id: string) => {
    if (!territories[id]) {
      throw new Error("Forbidden");
    }
    return { data: { statements: territories[id] } };
  });
};

const Probe = ({ leafTerritoryId }: { leafTerritoryId?: string }) => {
  const entities = useAnnotatorNearbySuggestions(
    anchors,
    5,
    leafTerritoryId,
    EntityEnums.Extension.Any,
    true
  );
  return entities ? (
    <ol>
      {entities.map((entity) => (
        <li key={entity.id}>{entity.id}</li>
      ))}
    </ol>
  ) : null;
};

let view: Rendered | null = null;

// the walk awaits one fetch after another; a few short turns let it finish
const settle = async () => {
  for (let turn = 0; turn < 10; turn++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
};

const mount = async (leafTerritoryId: string | undefined) => {
  const client = new QueryClient();
  // the T tree the Main page keeps loaded
  client.setQueryData(["tree"], tree);
  view = render(
    <QueryClientProvider client={client}>
      <Probe leafTerritoryId={leafTerritoryId} />
    </QueryClientProvider>
  );
  await settle();
  return client;
};

const fetchedTerritories = () => territoryGet.mock.calls.map(([id]) => id);

afterEach(() => {
  view?.unmount();
  view = null;
  vi.clearAllMocks();
});

describe("useAnnotatorNearbySuggestions", () => {
  it("stops going up the tree once 10 entities are listed", async () => {
    serve(statement("s", "ch", ids(1, 3)), {
      ch: [statement("c", "ch", ids(4, 10))],
      book: [statement("b", "book", ids(11, 11))],
    });
    await mount("ch");
    expect(view?.texts("li")).toEqual(ids(1, 10));
    expect(fetchedTerritories()).toEqual(["ch"]);
  });

  it("ends the walk at a T the user can't read", async () => {
    serve(statement("s", "ch", ids(1, 1)), {
      ch: [statement("c", "ch", ids(2, 2))],
      root: [statement("r", "root", ids(3, 3))],
    });
    await mount("ch");
    expect(view?.texts("li")).toEqual(ids(1, 2));
    expect(fetchedTerritories()).toEqual(["ch", "book"]);
  });

  it("starts from the T of the anchored statement when the selection is in no T anchor", async () => {
    serve(statement("s", "book", ids(1, 1)), {
      book: [statement("b", "book", ids(2, 2))],
      root: [statement("r", "root", ids(3, 3))],
    });
    await mount(undefined);
    expect(view?.texts("li")).toEqual(ids(1, 3));
    expect(fetchedTerritories()).toEqual(["book", "root"]);
  });

  it("walks again with fresh statements once a save invalidates the statements", async () => {
    serve(statement("s", "ch", ids(1, 1)), {
      ch: [statement("c", "ch", ids(2, 2))],
      book: [],
      root: [],
    });
    const client = await mount("ch");
    expect(view?.texts("li")).toEqual(ids(1, 2));

    // the statement in the subT gets a new actant
    serve(statement("s", "ch", ids(1, 1)), {
      ch: [statement("c", "ch", ids(2, 3))],
      book: [],
      root: [],
    });
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["statement"] });
    });
    await settle();
    expect(view?.texts("li")).toEqual(ids(1, 3));
  });
});
