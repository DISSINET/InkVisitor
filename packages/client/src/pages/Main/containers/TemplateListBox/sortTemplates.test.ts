import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { sortTemplates } from "./sortTemplates";

const template = (id: string, entityClass: EntityEnums.Class, createdAt?: string): IEntity =>
  ({ id, class: entityClass, createdAt: createdAt && new Date(createdAt) }) as unknown as IEntity;

// already in label order, as the templates query returns them
const templates = () => [
  template("statementOld", EntityEnums.Class.Statement, "2026-01-01"),
  template("person", EntityEnums.Class.Person),
  template("concept", EntityEnums.Class.Concept, "2026-03-01"),
  template("statementNew", EntityEnums.Class.Statement, "2026-05-01"),
];

const ids = (list: IEntity[]) => list.map((t) => t.id);

describe("sortTemplates", () => {
  it("keeps the label order", () => {
    expect(ids(sortTemplates(templates(), "label"))).toEqual([
      "statementOld",
      "person",
      "concept",
      "statementNew",
    ]);
  });

  it("groups by class in the dictionary order, label order inside a class", () => {
    expect(ids(sortTemplates(templates(), "class"))).toEqual([
      "concept",
      "person",
      "statementOld",
      "statementNew",
    ]);
  });

  it("puts the newest first and undated templates last", () => {
    expect(ids(sortTemplates(templates(), "newest"))).toEqual([
      "statementNew",
      "concept",
      "statementOld",
      "person",
    ]);
  });

  it("puts the promoted class first in every order", () => {
    expect(ids(sortTemplates(templates(), "label", EntityEnums.Class.Statement))).toEqual([
      "statementOld",
      "statementNew",
      "person",
      "concept",
    ]);
    expect(ids(sortTemplates(templates(), "newest", EntityEnums.Class.Person))).toEqual([
      "person",
      "statementNew",
      "concept",
      "statementOld",
    ]);
  });
});
