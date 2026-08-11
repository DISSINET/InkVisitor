import Territory from "./territory";
import User from "@models/user/user";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

function makeUser(role: UserEnums.Role): User {
  const u = new User({});
  u.role = role;
  u.rights = [];
  return u;
}

function makeTemplateTerritory(id: string): Territory {
  const t = new Territory({
    id,
    class: EntityEnums.Class.Territory,
  } as any);
  t.isTemplate = true;
  return t;
}

describe("Territory template rights", () => {
  const editor = makeUser(UserEnums.Role.Editor);
  const viewer = makeUser(UserEnums.Role.Viewer);
  const admin = makeUser(UserEnums.Role.Admin);
  const tmpl = makeTemplateTerritory("terr-tmpl");

  it("editor can edit a template territory", () => {
    expect(tmpl.canBeEditedByUser(editor)).toBe(true);
  });
  it("editor can delete a template territory", () => {
    expect(tmpl.canBeDeletedByUser(editor)).toBe(true);
  });
  it("editor can create a template territory", () => {
    expect(tmpl.canBeCreatedByUser(editor)).toBe(true);
  });
  it("viewer cannot edit a template territory", () => {
    expect(tmpl.canBeEditedByUser(viewer)).toBe(false);
  });
  it("viewer cannot delete a template territory", () => {
    expect(tmpl.canBeDeletedByUser(viewer)).toBe(false);
  });
  it("admin can edit a template territory", () => {
    expect(tmpl.canBeEditedByUser(admin)).toBe(true);
  });
  it("editor without any tree right can view a template territory", () => {
    expect(tmpl.canBeViewedByUser(editor)).toBe(true);
  });
  it("viewer can view a template territory", () => {
    expect(tmpl.canBeViewedByUser(viewer)).toBe(true);
  });
});
