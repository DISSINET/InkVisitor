import { IUser } from "@inkvisitor/shared/types";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

/**
 * Canonical admin user seeded into the test DB by globalSetup, mirroring
 * packages/database/datasets/default/users.json. This is the row that
 * getAuthenticatedAgent (see @modules/testAuth) signs in against.
 *
 * Load-bearing fields:
 * - id "1": the cookie session stores this id; the request pipeline re-fetches
 *   the user by it and requires active === true.
 * - name "admin": what deleteUsers preserves and what the signin flow expects.
 * - role admin: bypasses ACL on every protected route.
 * - password "admin" (plain): checkPassword accepts a non-bcrypt stored value.
 */
export const adminSeed: IUser = {
  id: "1",
  name: "admin",
  email: "admin@admin.com",
  password: "admin",
  active: true,
  verified: true,
  options: {
    defaultTerritory: "",
    defaultLanguage: EntityEnums.Language.Empty,
    searchLanguages: [],
    workingLanguages: [],
  },
  bookmarks: [],
  storedTerritories: [],
  role: UserEnums.Role.Admin,
  rights: [{ territory: "T0", mode: UserEnums.RoleMode.Admin }],
};
