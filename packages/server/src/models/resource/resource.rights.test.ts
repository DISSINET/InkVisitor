import Resource from "./resource";
import User, { UserRight } from "@models/user/user";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

function makeUser(role: UserEnums.Role, rights: UserRight[] = []): User {
  const u = new User({});
  u.role = role;
  u.rights = rights;
  return u;
}

function makeResource(id: string, documentId?: string): Resource {
  return new Resource({
    id,
    class: EntityEnums.Class.Resource,
    data: documentId ? { documentId } : {},
  } as any);
}

describe("Resource rights", () => {
  const viewer = makeUser(UserEnums.Role.Viewer);
  const admin = makeUser(UserEnums.Role.Admin);

  describe("documentless resource", () => {
    const res = makeResource("res-nodoc");

    it("editor can edit", () => {
      expect(res.canBeEditedByUser(makeUser(UserEnums.Role.Editor))).toBe(true);
    });
    it("editor can delete", () => {
      expect(res.canBeDeletedByUser(makeUser(UserEnums.Role.Editor))).toBe(true);
    });
    it("viewer cannot edit", () => {
      expect(res.canBeEditedByUser(viewer)).toBe(false);
    });
  });

  describe("resource with a document", () => {
    const res = makeResource("res-doc", "doc-1");
    const assigned = makeUser(UserEnums.Role.Editor, [
      new UserRight({ territory: "res-doc", mode: UserEnums.RoleMode.Annotate }),
    ]);
    const unassigned = makeUser(UserEnums.Role.Editor);

    it("assigned editor can edit", () => {
      expect(res.canBeEditedByUser(assigned)).toBe(true);
    });
    it("unassigned editor cannot edit", () => {
      expect(res.canBeEditedByUser(unassigned)).toBe(false);
    });
    it("admin can edit", () => {
      expect(res.canBeEditedByUser(admin)).toBe(true);
    });
  });
});
