import "ts-jest";
import { Db } from "@service/RethinkDB";
import { clean } from "@modules/common.test";
import User, { BookmarkFolder } from "@models/user/user";
import { IUser } from "@shared/types";
import { EntityEnums, UserEnums } from "@shared/enums";

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
      hideStatementElementsOrderTable: false,
      searchLanguages: [],
    },
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

  describe("User.removeBookmarksForEntity", function () {
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
        await User.removeBookmarksForEntity(db.connection, "notexists");
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
        await User.removeBookmarksForEntity(db.connection, "11");
        const user1After = await User.findUserById(db.connection, user1.id);
        const user2After = await User.findUserById(db.connection, user2.id);

        expect(user1After?.bookmarks[0].entityIds).toHaveLength(2); // 22, 33
        expect(user1After?.bookmarks[1].entityIds).toHaveLength(0);
        expect(user2After?.bookmarks[0].entityIds).toHaveLength(0);
      });
    });
  });
});
