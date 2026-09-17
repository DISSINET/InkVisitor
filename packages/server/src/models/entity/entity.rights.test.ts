import User from "@models/user/user";
import { getEntityClass } from "@models/factory";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

function makeUser(role: UserEnums.Role): User {
  const u = new User({});
  u.role = role;
  u.rights = [];
  return u;
}

// classes with no scoping of their own - they resolve through the base Entity
// predicates, unlike Territory, Statement and Resource
const UNSCOPED_CLASSES = [
  EntityEnums.Class.Concept,
  EntityEnums.Class.Person,
  EntityEnums.Class.Object,
  EntityEnums.Class.Action,
  EntityEnums.Class.Value,
  EntityEnums.Class.Event,
  EntityEnums.Class.Group,
  EntityEnums.Class.Location,
  EntityEnums.Class.Being,
];

function makeEntity(entityClass: EntityEnums.Class, isTemplate = false) {
  const e = getEntityClass({ id: `${entityClass}-1`, class: entityClass });
  e.isTemplate = isTemplate;
  return e;
}

describe("Entity rights for unscoped classes", () => {
  const viewer = makeUser(UserEnums.Role.Viewer);
  const editor = makeUser(UserEnums.Role.Editor);
  const admin = makeUser(UserEnums.Role.Admin);

  describe.each(UNSCOPED_CLASSES)("%s", (entityClass) => {
    const entity = makeEntity(entityClass);
    const template = makeEntity(entityClass, true);

    it("viewer cannot create", () => {
      expect(entity.canBeCreatedByUser(viewer)).toBe(false);
    });
    it("viewer cannot edit", () => {
      expect(entity.canBeEditedByUser(viewer)).toBe(false);
    });
    it("viewer cannot delete", () => {
      expect(entity.canBeDeletedByUser(viewer)).toBe(false);
    });
    it("viewer cannot create a template", () => {
      expect(template.canBeCreatedByUser(viewer)).toBe(false);
    });
    it("viewer cannot delete a template", () => {
      expect(template.canBeDeletedByUser(viewer)).toBe(false);
    });
    it("viewer can view", () => {
      expect(entity.canBeViewedByUser(viewer)).toBe(true);
    });

    it("editor can create", () => {
      expect(entity.canBeCreatedByUser(editor)).toBe(true);
    });
    it("editor can edit", () => {
      expect(entity.canBeEditedByUser(editor)).toBe(true);
    });
    it("editor can delete", () => {
      expect(entity.canBeDeletedByUser(editor)).toBe(true);
    });
    it("editor can create a template", () => {
      expect(template.canBeCreatedByUser(editor)).toBe(true);
    });
    it("editor can edit a template", () => {
      expect(template.canBeEditedByUser(editor)).toBe(true);
    });
    it("editor can delete a template", () => {
      expect(template.canBeDeletedByUser(editor)).toBe(true);
    });

    it("admin can delete", () => {
      expect(entity.canBeDeletedByUser(admin)).toBe(true);
    });
  });
});
