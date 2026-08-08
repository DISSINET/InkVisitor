import { IResponseTree, IResponseUser } from "@inkvisitor/shared/types";
import { resolveDefaultTerritory } from "./defaultTerritory";

const asUser = (defaultTerritory: string): IResponseUser =>
  ({ options: { defaultTerritory } }) as unknown as IResponseUser;

const node = (id: string, children: IResponseTree[] = []): IResponseTree =>
  ({ territory: { id }, children }) as unknown as IResponseTree;

const tree = node("T0", [node("T1"), node("T2", [node("T3")])]);

describe("resolveDefaultTerritory", () => {
  it("opens the default territory on a clean load", () => {
    expect(resolveDefaultTerritory({ user: asUser("T3"), tree, isCleanLoad: true })).toBe("T3");
  });

  it("leaves a load that came in with params alone", () => {
    expect(resolveDefaultTerritory({ user: asUser("T3"), tree, isCleanLoad: false })).toBe(null);
  });

  it("opens nothing when the user has no default", () => {
    expect(resolveDefaultTerritory({ user: asUser(""), tree, isCleanLoad: true })).toBe(null);
  });

  it("opens nothing when the default is not in the tree the user can see", () => {
    expect(resolveDefaultTerritory({ user: asUser("T9"), tree, isCleanLoad: true })).toBe(null);
  });

  it("waits for both the user and the tree", () => {
    expect(resolveDefaultTerritory({ user: undefined, tree, isCleanLoad: true })).toBe(null);
    expect(
      resolveDefaultTerritory({ user: asUser("T3"), tree: undefined, isCleanLoad: true }),
    ).toBe(null);
  });
});
