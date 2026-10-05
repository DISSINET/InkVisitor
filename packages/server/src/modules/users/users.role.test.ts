import { apiPath } from "@common/constants";
import { UserEnums } from "@inkvisitor/shared/enums";
import { pool } from "@middlewares/db";
import User from "@models/user/user";
import { AuthAgent, createAgentWithUserId } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { deleteUsers } from "@service/shorthands";
import { IUser } from "@inkvisitor/shared/types";
import { r, RDatum } from "rethinkdb-ts";

describe("Users role change", function () {
  const db = new Db();
  // the request pipeline re-fetches the user by id, so every role lives in the
  // db row and each actor gets a cookie session of its own
  const makeUser = (role: UserEnums.Role) =>
    new User({
      id: `role-${role}-${Math.random()}`,
      name: `role-${role}-${Math.random()}`,
      email: `role-${role}-${Math.random()}@test.com`,
      active: true,
      verified: true,
      role,
    });

  const owner = makeUser(UserEnums.Role.Owner);
  const admin = makeUser(UserEnums.Role.Admin);
  const viewer = makeUser(UserEnums.Role.Viewer);
  let ownerAgent: AuthAgent;
  let adminAgent: AuthAgent;
  let viewerAgent: AuthAgent;
  // production opens PUT /users/:userId to every role (users edit their own
  // account); the test db has no such row, so it is mirrored here
  const aclId = `users-put-any-${Math.random()}`;

  const createTarget = async (role: UserEnums.Role): Promise<User> => {
    const user = makeUser(role);
    await user.save(db.connection);
    return user;
  };

  const storedRole = async (userId: string): Promise<string> => {
    const row = await r.table(User.table).get(userId).run(db.connection);
    return row.role;
  };

  beforeAll(async () => {
    await db.initDb();
    await r
      .table("acl_permissions")
      .insert({
        id: aclId,
        controller: "users",
        method: "PUT",
        route: ":userId",
        roles: ["*"],
      })
      .run(db.connection);
    for (const user of [owner, admin, viewer]) {
      await user.save(db.connection);
    }
    ownerAgent = await createAgentWithUserId(owner.id);
    adminAgent = await createAgentWithUserId(admin.id);
    viewerAgent = await createAgentWithUserId(viewer.id);
  });

  afterAll(async () => {
    await r.table("acl_permissions").get(aclId).delete().run(db.connection);
    await deleteUsers(db);
    await db.close();
    await pool.end();
  });

  it("lets an owner make another user an owner", async () => {
    const target = await createTarget(UserEnums.Role.Editor);

    await ownerAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ role: UserEnums.Role.Owner })
      .expect(200);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Owner);
  });

  it("does not let an admin make a user an owner", async () => {
    const target = await createTarget(UserEnums.Role.Editor);

    await adminAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ role: UserEnums.Role.Owner })
      .expect(403);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Editor);
  });

  it("does not let an admin make themselves an owner", async () => {
    await adminAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Owner })
      .expect(403);

    expect(await storedRole(admin.id)).toEqual(UserEnums.Role.Admin);
  });

  it("does not let a viewer change their own role", async () => {
    await viewerAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Admin })
      .expect(403);

    expect(await storedRole(viewer.id)).toEqual(UserEnums.Role.Viewer);
  });

  it("lets an admin switch a user between the non-owner roles", async () => {
    const target = await createTarget(UserEnums.Role.Viewer);

    await adminAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ role: UserEnums.Role.Editor })
      .expect(200);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Editor);
  });

  it("lets an owner take the owner role from another owner", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await ownerAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ role: UserEnums.Role.Admin })
      .expect(200);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Admin);
  });

  it("does not let an admin change an owner's role", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await adminAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ role: UserEnums.Role.Viewer })
      .expect(403);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Owner);
  });

  it("does not let an admin set an owner's password", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await adminAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ password: "taken-over" })
      .expect(403);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.password).toBeUndefined();
  });

  it("does not let an admin deactivate an owner", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await adminAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ active: false })
      .expect(403);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.active).toBe(true);
  });

  it("does not let an admin reset an owner's password", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await adminAgent
      .patch(`${apiPath}/users/${target.id}/password`)
      .expect(403);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.password).toBeUndefined();
  });

  it("lets an owner reset another owner's password", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await ownerAgent
      .patch(`${apiPath}/users/${target.id}/password`)
      .expect(200);
  });

  it("lets an admin reset a non-owner's password", async () => {
    const target = await createTarget(UserEnums.Role.Editor);

    await adminAgent
      .patch(`${apiPath}/users/${target.id}/password`)
      .expect(200);
  });

  it("lets an owner give up the owner role while another owner remains", async () => {
    const target = await createTarget(UserEnums.Role.Owner);
    const targetAgent = await createAgentWithUserId(target.id);

    await targetAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Admin })
      .expect(200);

    expect(await storedRole(target.id)).toEqual(UserEnums.Role.Admin);
  });

  it("does not let an admin create an owner", async () => {
    const email = `role-created-${Math.random()}@test.com`;

    await adminAgent
      .post(`${apiPath}/users`)
      .send({ email, role: UserEnums.Role.Owner })
      .expect(403);

    const stored = await r
      .table(User.table)
      .filter({ email })
      .count()
      .run(db.connection);
    expect(stored).toEqual(0);
  });

  it("accepts a body that repeats the current role", async () => {
    await viewerAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Viewer, name: viewer.name })
      .expect(200);
  });

  it("does not let the last owner give up the owner role", async () => {
    await r
      .table(User.table)
      .filter((user: RDatum<IUser>) => user("role").eq(UserEnums.Role.Owner).and(user("id").ne(owner.id)))
      .update({ role: UserEnums.Role.Admin })
      .run(db.connection);

    await ownerAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Admin })
      .expect(403);

    expect(await storedRole(owner.id)).toEqual(UserEnums.Role.Owner);
  });

  it("does not count an inactive owner as another owner", async () => {
    await r
      .table(User.table)
      .filter((user: RDatum<IUser>) => user("role").eq(UserEnums.Role.Owner).and(user("id").ne(owner.id)))
      .update({ role: UserEnums.Role.Admin })
      .run(db.connection);
    const inactiveOwner = makeUser(UserEnums.Role.Owner);
    inactiveOwner.active = false;
    await inactiveOwner.save(db.connection);

    await ownerAgent
      .put(`${apiPath}/users/me`)
      .send({ role: UserEnums.Role.Admin })
      .expect(403);

    expect(await storedRole(owner.id)).toEqual(UserEnums.Role.Owner);
  });

  it("does not let the last active owner be deactivated", async () => {
    await r
      .table(User.table)
      .filter((user: RDatum<IUser>) => user("role").eq(UserEnums.Role.Owner).and(user("id").ne(owner.id)))
      .update({ role: UserEnums.Role.Admin })
      .run(db.connection);

    await adminAgent
      .put(`${apiPath}/users/${owner.id}`)
      .send({ active: false })
      .expect(403);

    const row = await r.table(User.table).get(owner.id).run(db.connection);
    expect(row.active).toEqual(true);
  });

  it("lets an owner deactivate another owner while one stays active", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await ownerAgent
      .put(`${apiPath}/users/${target.id}`)
      .send({ active: false })
      .expect(200);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.active).toEqual(false);
  });

  it("does not let an admin delete an owner", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await adminAgent.delete(`${apiPath}/users/${target.id}`).expect(403);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.deletedAt).toBeUndefined();
  });

  it("lets an owner delete another owner", async () => {
    const target = await createTarget(UserEnums.Role.Owner);

    await ownerAgent.delete(`${apiPath}/users/${target.id}`).expect(200);

    const row = await r.table(User.table).get(target.id).run(db.connection);
    expect(row.deletedAt).toBeDefined();
  });

  it("does not let the last active owner be deleted", async () => {
    await r
      .table(User.table)
      .filter((user: RDatum<IUser>) => user("role").eq(UserEnums.Role.Owner).and(user("id").ne(owner.id)))
      .update({ role: UserEnums.Role.Admin })
      .run(db.connection);

    await ownerAgent.delete(`${apiPath}/users/${owner.id}`).expect(403);

    const row = await r.table(User.table).get(owner.id).run(db.connection);
    expect(row.deletedAt).toBeUndefined();
  });
});
