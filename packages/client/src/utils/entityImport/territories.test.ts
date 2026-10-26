import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { normalizeEntities } from "./normalizeEntities";
import { validateTerritories } from "./territories";

const normalize = (items: Record<string, unknown>[]) =>
  normalizeEntities(items, { defaultLanguage: EntityEnums.Language.English }).entities;

const territory = (id: string, parentId: string) => ({
  id,
  class: "T",
  labels: [id],
  data: { parent: { territoryId: parentId } },
});

describe("validateTerritories", () => {
  it("orders every territory after its parent and keeps the input order otherwise", () => {
    const entities = normalize([
      territory("folio", "manuscript"),
      { id: "dog", class: "C", labels: ["dog"] },
      territory("manuscript", "catalogue"),
    ]);
    const { errors, ordered } = validateTerritories(entities, UserEnums.Role.Admin);

    expect(errors).toEqual([]);
    expect(ordered.map((item) => item.entity.id)).toEqual(["manuscript", "folio", "dog"]);
  });

  it("lets only admins and owners import territories", () => {
    const entities = normalize([territory("a", "catalogue"), { class: "C", labels: ["c"] }]);

    expect(validateTerritories(entities, UserEnums.Role.Owner).errors).toEqual([]);
    const { errors } = validateTerritories(entities, UserEnums.Role.Editor);
    expect(errors.map((error) => error.entityIndex)).toEqual([1]);
    expect(errors[0].message).toBe("only admins can import territories");
  });

  it("reports a parent loop inside the input once", () => {
    const entities = normalize([
      territory("a", "b"),
      territory("b", "c"),
      territory("c", "a"),
      territory("self", "self"),
    ]);
    const { errors, ordered } = validateTerritories(entities, UserEnums.Role.Admin);

    expect(errors.map((error) => error.message)).toEqual([
      'territory parent loop: "a" → "b" → "c" → "a"',
      'territory parent loop: "self" → "self"',
    ]);
    expect(ordered).toHaveLength(4);
  });
});
