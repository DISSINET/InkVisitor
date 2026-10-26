import Statement from "./statement";
import User from "@models/user/user";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

function makeUser(role: UserEnums.Role): User {
  const u = new User({});
  u.role = role;
  u.rights = [];
  return u;
}

function makeTemplateStatement(id: string): Statement {
  const s = new Statement({
    id,
    class: EntityEnums.Class.Statement,
  } as any);
  s.isTemplate = true;
  return s;
}

describe("Statement template rights", () => {
  const editor = makeUser(UserEnums.Role.Editor);
  const viewer = makeUser(UserEnums.Role.Viewer);
  const tmpl = makeTemplateStatement("stmt-tmpl");

  it("editor can edit a template statement", () => {
    expect(tmpl.canBeEditedByUser(editor)).toBe(true);
  });
  it("editor can delete a template statement", () => {
    expect(tmpl.canBeDeletedByUser(editor)).toBe(true);
  });
  it("editor can create a template statement", () => {
    expect(tmpl.canBeCreatedByUser(editor)).toBe(true);
  });
  it("viewer cannot edit a template statement", () => {
    expect(tmpl.canBeEditedByUser(viewer)).toBe(false);
  });
  it("viewer cannot delete a template statement", () => {
    expect(tmpl.canBeDeletedByUser(viewer)).toBe(false);
  });
});
