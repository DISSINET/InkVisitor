import Relation from "./relation";
import User from "@models/user/user";
import { IEntity } from "@inkvisitor/shared/types";
import {
  EntityEnums,
  RelationEnums,
  UserEnums,
} from "@inkvisitor/shared/enums";

const writableT = "T-relation-write";
const readOnlyT = "T-relation-read";

// both territories are named explicitly, so the right is an exact match and the
// lookup never walks the territory tree - which is not built in a unit run
function makeUser(role: UserEnums.Role): User {
  const u = new User({});
  u.role = role;
  u.rights = [
    { territory: writableT, mode: UserEnums.RoleMode.Write },
    { territory: readOnlyT, mode: UserEnums.RoleMode.Read },
  ] as any;
  return u;
}

function statementIn(id: string, territoryId: string): IEntity {
  return {
    id,
    class: EntityEnums.Class.Statement,
    data: { territory: { territoryId, order: 0 } },
  } as any;
}

function concept(id: string): IEntity {
  return { id, class: EntityEnums.Class.Concept, data: {} } as any;
}

function territory(id: string): IEntity {
  return { id, class: EntityEnums.Class.Territory, data: {} } as any;
}

function makeRelation(entities: IEntity[]): Relation {
  const relation = new Relation({
    id: `rel-${entities.map((e) => e.id).join("-")}`,
    type: RelationEnums.Type.Classification,
    entityIds: entities.map((e) => e.id),
  });
  relation.entities = entities;
  return relation;
}

describe("Relation rights over the tree access of a linked entity", () => {
  const editor = makeUser(UserEnums.Role.Editor);
  const viewer = makeUser(UserEnums.Role.Viewer);
  const admin = makeUser(UserEnums.Role.Admin);

  const inWritable = makeRelation([
    statementIn("S-write", writableT),
    concept("C1"),
  ]);
  const inReadOnly = makeRelation([
    statementIn("S-read", readOnlyT),
    concept("C1"),
  ]);
  const betweenConcepts = makeRelation([concept("C1"), concept("C2")]);
  const onWritableT = makeRelation([territory(writableT), concept("C1")]);
  const onReadOnlyT = makeRelation([territory(readOnlyT), concept("C1")]);

  it("editor can create a relation on a statement he may write", () => {
    expect(inWritable.canBeCreatedByUser(editor)).toBe(true);
  });
  it("editor cannot create a relation on a statement he may only read", () => {
    expect(inReadOnly.canBeCreatedByUser(editor)).toBe(false);
  });
  it("editor cannot edit a relation on a statement he may only read", () => {
    expect(inReadOnly.canBeEditedByUser(editor)).toBe(false);
  });
  it("editor cannot delete a relation on a statement he may only read", () => {
    expect(inReadOnly.canBeDeletedByUser(editor)).toBe(false);
  });
  it("editor can create a relation on a territory he may write", () => {
    expect(onWritableT.canBeCreatedByUser(editor)).toBe(true);
  });
  it("editor cannot create a relation on a territory he may only read", () => {
    expect(onReadOnlyT.canBeCreatedByUser(editor)).toBe(false);
  });
  it("editor cannot delete a relation on a territory he may only read", () => {
    expect(onReadOnlyT.canBeDeletedByUser(editor)).toBe(false);
  });
  it("editor can create a relation between entities held by no territory", () => {
    expect(betweenConcepts.canBeCreatedByUser(editor)).toBe(true);
  });
  it("viewer cannot create a relation at all", () => {
    expect(betweenConcepts.canBeCreatedByUser(viewer)).toBe(false);
  });
  it("admin can create a relation on a statement the editor may only read", () => {
    expect(inReadOnly.canBeCreatedByUser(admin)).toBe(true);
  });
  it("refuses a relation whose entities were not preloaded", () => {
    const unloaded = makeRelation([statementIn("S-write", writableT)]);
    unloaded.entities = undefined;
    expect(unloaded.canBeCreatedByUser(editor)).toBe(false);
    expect(unloaded.canBeEditedByUser(editor)).toBe(false);
    expect(unloaded.canBeDeletedByUser(editor)).toBe(false);
  });
});
