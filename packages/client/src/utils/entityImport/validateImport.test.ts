import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { validateImport } from "./validateImport";

const existingEntity = (id: string, entityClass: EntityEnums.Class) =>
  ({ id, class: entityClass, labels: [id], isTemplate: false }) as IEntity;

const contextWith = (entities: IEntity[], role = UserEnums.Role.Admin) => {
  const getEntities = vi.fn(async (ids: string[]) =>
    entities.filter((entity) => ids.includes(entity.id))
  );
  const getForwardRelations = vi.fn(async () => []);
  return {
    role,
    defaultLanguage: EntityEnums.Language.English,
    source: { getEntities, getForwardRelations },
  };
};

describe("validateImport", () => {
  it("returns the plan for a valid batch, territories after their parents", async () => {
    const context = contextWith([
      existingEntity("animal", EntityEnums.Class.Concept),
      existingEntity("catalogue", EntityEnums.Class.Territory),
    ]);
    const text = JSON.stringify([
      {
        id: "folio",
        class: "T",
        labels: ["Folio 1r"],
        data: { parent: { territoryId: "manuscript" } },
      },
      {
        id: "manuscript",
        class: "T",
        labels: ["Manuscript A"],
        data: { parent: { territoryId: "catalogue" } },
      },
      {
        id: "dog",
        class: "C",
        labels: ["dog"],
        relations: [{ type: "SCL", entityIds: ["dog", "animal"] }],
      },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(errors).toEqual([]);
    expect(plan!.entities.map((entity) => entity.id)).toEqual(["manuscript", "folio", "dog"]);
    expect(plan!.relations).toMatchObject([
      { type: RelationEnums.Type.Superclass, entityIds: ["dog", "animal"] },
    ]);
    expect(Object.keys(plan!.existingEntities).sort()).toEqual(["animal", "catalogue"]);
    // the input ids and the references are checked in one request
    expect(context.source.getEntities).toHaveBeenCalledTimes(1);
  });

  it("collects errors of every kind without a plan", async () => {
    const context = contextWith([existingEntity("taken", EntityEnums.Class.Concept)], UserEnums.Role.Editor);
    const text = JSON.stringify([
      { id: "taken", class: "C", labels: ["taken"] },
      { class: "T", labels: ["T"], data: { parent: { territoryId: "nowhere" } } },
      { class: "C", labels: ["dog"], props: [{ type: "ghost" }] },
    ]);

    const { errors, plan } = await validateImport(text, context);

    expect(plan).toBeNull();
    expect(errors.map((error) => [error.entityIndex, error.path])).toEqual([
      [1, "id"],
      [2, "data.parent.territoryId"],
      [2, "class"],
      [3, "props[0].type.entityId"],
    ]);
  });

  it("stops at a parse error without asking the database", async () => {
    const context = contextWith([]);
    const { errors } = await validateImport("[", context);

    expect(errors).toHaveLength(1);
    expect(context.source.getEntities).not.toHaveBeenCalled();
  });
});
