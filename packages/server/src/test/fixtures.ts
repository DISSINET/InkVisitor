import { IUser } from "@inkvisitor/shared/types";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

/**
 * Canonical admin user seeded into the test DB by globalSetup, mirroring
 * packages/database/datasets/default/users.json. Single source of truth shared
 * by globalSetup (which inserts the row) and setup.ts (which signs the
 * TEST_JWT_TOKEN over it).
 *
 * Load-bearing fields:
 * - id "1": the JWT embeds this; validateJwt + customizeRequest re-fetch the
 *   user by this id and require active === true.
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
  },
  bookmarks: [],
  storedTerritories: [],
  role: UserEnums.Role.Admin,
  rights: [{ territory: "T0", mode: UserEnums.RoleMode.Admin }],
};
