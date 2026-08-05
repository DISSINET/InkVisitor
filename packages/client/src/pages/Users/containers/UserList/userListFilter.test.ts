import { UserEnums } from "@inkvisitor/shared/enums";
import { IResponseUser } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import {
  emptyUserListFilters,
  filterUsers,
  hasActiveUserListFilters,
} from "./userListFilter";

const makeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: UserEnums.Role;
  active: boolean;
}): IResponseUser => user as IResponseUser;

const alice = makeUser({
  id: "1",
  name: "alice",
  email: "alice@inkvisitor.com",
  role: UserEnums.Role.Admin,
  active: true,
});
const bob = makeUser({
  id: "2",
  name: "bob",
  email: "bob@mail.muni.cz",
  role: UserEnums.Role.Editor,
  active: true,
});
const carol = makeUser({
  id: "3",
  name: "Carol",
  email: "carol@mail.muni.cz",
  role: UserEnums.Role.Viewer,
  active: false,
});
const users = [alice, bob, carol];

describe("filterUsers", () => {
  it("returns every user for empty filters", () => {
    expect(filterUsers(users, emptyUserListFilters)).toEqual(users);
  });

  it("matches the query against the name", () => {
    expect(filterUsers(users, { ...emptyUserListFilters, query: "bob" })).toEqual([bob]);
  });

  it("matches the query against the email", () => {
    expect(filterUsers(users, { ...emptyUserListFilters, query: "muni.cz" })).toEqual([
      bob,
      carol,
    ]);
  });

  it("matches the query case-insensitively and ignores surrounding whitespace", () => {
    expect(filterUsers(users, { ...emptyUserListFilters, query: "  CAROL " })).toEqual([carol]);
  });

  it("filters by role", () => {
    expect(
      filterUsers(users, { ...emptyUserListFilters, role: UserEnums.Role.Editor }),
    ).toEqual([bob]);
  });

  it("hides inactive users", () => {
    expect(filterUsers(users, { ...emptyUserListFilters, hideInactive: true })).toEqual([
      alice,
      bob,
    ]);
  });

  it("combines filters with AND", () => {
    expect(
      filterUsers(users, { query: "muni.cz", role: UserEnums.Role.Viewer, hideInactive: true }),
    ).toEqual([]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterUsers(users, { ...emptyUserListFilters, query: "nobody" })).toEqual([]);
  });
});

describe("hasActiveUserListFilters", () => {
  it("is false for empty filters", () => {
    expect(hasActiveUserListFilters(emptyUserListFilters)).toBe(false);
  });

  it("is false for a query of only whitespace", () => {
    expect(hasActiveUserListFilters({ ...emptyUserListFilters, query: "   " })).toBe(false);
  });

  it("is true for a query", () => {
    expect(hasActiveUserListFilters({ ...emptyUserListFilters, query: "bob" })).toBe(true);
  });

  it("is true for a role", () => {
    expect(
      hasActiveUserListFilters({ ...emptyUserListFilters, role: UserEnums.Role.Viewer }),
    ).toBe(true);
  });

  it("is true while inactive users are hidden", () => {
    expect(hasActiveUserListFilters({ ...emptyUserListFilters, hideInactive: true })).toBe(true);
  });
});
