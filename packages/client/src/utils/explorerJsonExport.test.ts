import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { AuditScope, IAudit, IEntity, Relation } from "@inkvisitor/shared/types";
import { Query } from "@inkvisitor/shared/types/query";
import { EventType } from "@inkvisitor/shared/types/stats";
import { describe, expect, it } from "vitest";
import { buildExplorerJsonExport } from "./explorerJsonExport";

const concept = (id: string) =>
  ({
    id,
    class: EntityEnums.Class.Concept,
    labels: [id],
    detail: "",
    language: EntityEnums.Language.English,
    status: EntityEnums.Status.Approved,
    notes: [],
    data: {},
    props: [],
    references: [],
    isTemplate: false,
  }) as unknown as IEntity;

const relation = (id: string, type: RelationEnums.Type, entityIds: string[]) =>
  ({ id, type, entityIds, order: 1 }) as Relation.IRelation;

const audit: IAudit = {
  id: "a1",
  modelId: "dog",
  auditScope: AuditScope.Entity,
  user: "1",
  date: new Date("2026-01-01"),
  changes: {},
  type: EventType.CREATE,
};

const meta = { exportedAt: "2026-11-22T10:00:00.000Z", version: "1.7.0", query: {} as Query.INode };

describe("buildExplorerJsonExport", () => {
  const file = buildExplorerJsonExport(
    {
      entities: [concept("animal"), concept("dog")],
      relations: [
        relation("scl", RelationEnums.Type.Superclass, ["dog", "animal"]),
        relation("syn", RelationEnums.Type.Synonym, ["hound", "dog", "animal"]),
      ],
      audits: [audit],
    },
    ["dog", "animal"],
    meta
  );

  it("lists the entities in the selection order", () => {
    expect(file.entities.map((entity) => entity.id)).toEqual(["dog", "animal"]);
  });

  it("gives each entity the relations it states itself", () => {
    expect(file.entities[0].relations).toEqual([
      { type: RelationEnums.Type.Superclass, entityIds: ["dog", "animal"] },
      { type: RelationEnums.Type.Synonym, entityIds: ["hound", "dog", "animal"] },
    ]);
    expect(file.entities[1].relations).toEqual([
      { type: RelationEnums.Type.Synonym, entityIds: ["hound", "dog", "animal"] },
    ]);
  });

  it("keeps the audits as stored, next to the export metadata", () => {
    expect(file.audits).toEqual([audit]);
    expect(file).toMatchObject(meta);
  });
});
