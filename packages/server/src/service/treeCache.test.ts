import { createMockTree, clean } from "@modules/common.test";
import request from "supertest";
import { apiPath } from "@common/constants";
import { ITerritory } from "@shared/types";
import { Db } from "@service/RethinkDB";
import { findEntityById } from "@service/shorthands";
import treeCache, { TreeCache } from "./treeCache";
import { UserEnums } from "@shared/enums";
import User, { UserRight } from "@models/user/user";

describe("TreeCache", function () {
    const db = new Db();
    const randSuffix = "tree-moveTerritory-" + Math.random().toString();
    const cache = new TreeCache();

    beforeAll(async () => {
        await db.initDb();
        await createMockTree(db, randSuffix);
        cache.tree = await cache.createTree(db);
    });

    afterEach(async () => {
    });

    afterAll(async () => {
        await clean(db);
    });

    describe("TreeCache.getRightForTerritory", () => {
        it("should find no right for empty array", () => {
            expect(cache.getRightForTerritory("T0", [])).toBeUndefined();
        });
        it("should find exact right for exact territory", () => {
            const expected = new UserRight({ mode: UserEnums.RoleMode.Admin, territory: "T0" });
            expect(cache.getRightForTerritory("T0", [expected])).toEqual(expected);
        });
        it("should find exact right for exact territory", () => {
            const rootRight = new UserRight({ mode: UserEnums.RoleMode.Admin, territory: `root-${randSuffix}` });
            expect(cache.getRightForTerritory(`T1-${randSuffix}`, [rootRight])).toEqual(rootRight);
        });
    });
});
