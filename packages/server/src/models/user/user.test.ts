import "ts-jest";
import { r as rethink } from "rethinkdb-ts";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import User, { BookmarkFolder, StoredTerritory } from "@models/user/user";
import { IUser } from "@inkvisitor/shared/types";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";

const prepareUserData = (): IUser => {
  return {
    active: false,
    bookmarks: [],
    email: "",
    id: "",
    hash: "",
    name: "",
    options: {
      defaultLanguage: EntityEnums.Language.English,
      defaultTerritory: "",
      defaultStatementLanguage: EntityEnums.Language.English,
      searchLanguages: [],
      workingLanguages: [],
      // server-side UserOptions defaults this to false; the field is not yet in
      // the shared IUserOptions type, so it is cast in below.
      hideStatementElementsOrderTable: false,
    } as IUser["options"],
    verified: true,
    rights: [],
    role: UserEnums.Role.Viewer,
    storedTerritories: [],
  };
};

export const prepareUser = (): User => {
  const id = Math.random().toString();
  return new User({
    id,
    name: id,
    email: id,
  });
};

describe("models/user", function () {
  describe("User constructor test", function () {
    describe("empty data", () => {
      const emptyData = {};
      const emptyUser = new User({});

      it("should return empty user", () => {
        const out = new User(emptyData);
        expect(out).toEqual(emptyUser);
      });
    });

    describe("ok data", () => {
      const fullData = prepareUserData();
      const fullUser = new User({ ...fullData });

      it("should return full user", () => {
        expect(JSON.parse(JSON.stringify(fullUser))).toEqual(fullData);
      });
    });
  });

  describe("User.save", function () {
    let db: Db;
    beforeAll(async () => {
      db = new Db();
      await db.initDb();
    });

    afterAll(async () => {
      await clean(db);
    });

    describe("insert user", () => {
      it("should save with valid data", async () => {
        const user = new User({});
        await user.save(db.connection);

        const createdData = await User.findUserById(db.connection, user.id);
        expect(createdData).toBeTruthy();
      });
    });
  });

  describe("User.removeBookmarkedEntity", function () {
    let db: Db;
    const user1 = prepareUser();
    user1.bookmarks.push(
      new BookmarkFolder({
        entityIds: ["11", "22", "33"],
        id: "1",
        name: "test",
      })
    );
    user1.bookmarks.push(
      new BookmarkFolder({
        entityIds: ["11"],
        id: "1",
        name: "test",
      })
    );

    const user2 = prepareUser();
    user2.bookmarks.push(
      new BookmarkFolder({
        entityIds: ["11"],
        id: "1",
        name: "test",
      })
    );

    beforeAll(async () => {
      db = new Db();
      await db.initDb();
      await user1.save(db.connection);
      await user2.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    describe("not existing entity id", () => {
      it("should not change anything", async () => {
        await User.removeBookmarkedEntity(db.connection, "notexists");
        const user1After = await User.findUserById(db.connection, user1.id);
        const user2After = await User.findUserById(db.connection, user2.id);

        expect(user1After).toBeTruthy();
        expect(user2After).toBeTruthy();

        expect(JSON.stringify(user1After?.bookmarks)).toEqual(
          JSON.stringify(user1.bookmarks)
        );
        expect(JSON.stringify(user2After?.bookmarks)).toEqual(
          JSON.stringify(user2.bookmarks)
        );
      });
    });

    describe("existing id in both users", () => {
      it("should remove from both users", async () => {
        await User.removeBookmarkedEntity(db.connection, "11");
        const user1After = await User.findUserById(db.connection, user1.id);
        const user2After = await User.findUserById(db.connection, user2.id);

        expect(user1After?.bookmarks[0].entityIds).toHaveLength(2); // 22, 33
        expect(user1After?.bookmarks[1].entityIds).toHaveLength(0);
        expect(user2After?.bookmarks[0].entityIds).toHaveLength(0);
      });
    });
  });

  describe("User.removeStoredTerritory", function () {
    let db: Db;
    const user1 = prepareUser();
    user1.storedTerritories.push(
      new StoredTerritory({
        territoryId: Math.random().toString(),
      })
    );
    user1.storedTerritories.push(
      new StoredTerritory({
        territoryId: Math.random().toString(),
      })
    );

    const user2 = prepareUser();
    user2.storedTerritories.push(
      new StoredTerritory({
        territoryId: user1.storedTerritories[0].territoryId,
      })
    );

    beforeAll(async () => {
      db = new Db();
      await db.initDb();
      await user1.save(db.connection);
      await user2.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    describe("not existing territory id", () => {
      it("should not change anything", async () => {
        await User.removeStoredTerritory(db.connection, "notexists");
        const user1After = await User.findUserById(db.connection, user1.id);
        const user2After = await User.findUserById(db.connection, user2.id);

        expect(user1After).toBeTruthy();
        expect(user2After).toBeTruthy();

        expect(JSON.stringify(user1After?.storedTerritories)).toEqual(
          JSON.stringify(user1.storedTerritories)
        );
        expect(JSON.stringify(user2After?.storedTerritories)).toEqual(
          JSON.stringify(user2.storedTerritories)
        );
      });
    });

    describe("existing id in both users", () => {
      it("should remove from both users", async () => {
        await User.removeStoredTerritory(
          db.connection,
          user1.storedTerritories[0].territoryId
        );
        const user1After = await User.findUserById(db.connection, user1.id);
        const user2After = await User.findUserById(db.connection, user2.id);

        expect(user1After?.storedTerritories).toHaveLength(1);
        expect(user1After?.storedTerritories[0].territoryId).toEqual(
          user1.storedTerritories[1].territoryId
        );
        expect(user2After?.storedTerritories).toHaveLength(0);
      });
    });
  });

  describe("User.delete", function () {
    let db: Db;
    const user1 = prepareUser();

    beforeAll(async () => {
      db = new Db();
      await db.initDb();
      await user1.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should set deletedAt to current date", async () => {
      const result = await user1.delete(db.connection)
      expect(result.replaced).toBe(1);

      // deleted
      const user1After = await User.findUserById(db.connection, user1.id);
      expect(user1After).toBeFalsy();

      // user1 was soft-deleted (deletedAt set), so it must be looked up with
      // includeThrashed=true; passing false filters out thrashed users.
      const thrashedUser1 = await User.findUserByLogin(db, user1.email, true)
      expect(thrashedUser1).not.toBeNull();

      // The User constructor drops deletedAt (fillFlatObject skips fields whose
      // class default is undefined), so assert the persisted soft-delete marker
      // on the raw db row rather than the rehydrated model.
      const rawRow = await rethink
        .table(User.table)
        .get(user1.id)
        .run(db.connection);
      expect(rawRow).toBeTruthy();
      expect((rawRow as any).deletedAt).toBeTruthy();
    });
  });
});
