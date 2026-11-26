import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { groupDrafts, matchesSearch } from "./EntityImportDraftList";

const entity = (id: string, entityClass: EntityEnums.Class) =>
  ({ id, class: entityClass, labels: [id] }) as IEntity;

describe("groupDrafts", () => {
  it("groups by class in the order the classes appear, Values last", () => {
    const groups = groupDrafts([
      entity("v1", EntityEnums.Class.Value),
      entity("augustine", EntityEnums.Class.Person),
      entity("dog", EntityEnums.Class.Concept),
      entity("monica", EntityEnums.Class.Person),
      entity("v2", EntityEnums.Class.Value),
    ]);
    const ids = groups.map(([entityClass, members]) => [entityClass, members.map((m) => m.id)]);
    expect(ids).toEqual([
      [EntityEnums.Class.Person, ["augustine", "monica"]],
      [EntityEnums.Class.Concept, ["dog"]],
      [EntityEnums.Class.Value, ["v1", "v2"]],
    ]);
  });
});

describe("matchesSearch", () => {
  const augustine = {
    ...entity("augustine", EntityEnums.Class.Person),
    labels: ["Augustinus Hipponensis", "Aurèle"],
  } as IEntity;

  it("finds a text in any label, ignoring case and accents", () => {
    expect(matchesSearch(augustine, "hippo")).toBe(true);
    expect(matchesSearch(augustine, "AURELE")).toBe(true);
    expect(matchesSearch(augustine, "monica")).toBe(false);
    expect(matchesSearch(augustine, "  ")).toBe(true);
  });
});
