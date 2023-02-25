import { createMockTree, clean } from "@modules/common.test";
import { Db } from "@service/RethinkDB";
import { TreeCache } from "./treeCache";
import { UserEnums } from "@shared/enums";
import { UserRight } from "@models/user/user";

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
        const expectedProvided = new UserRight({ mode: UserEnums.RoleMode.Admin, territory: "T0" });
        const rootRight = new UserRight({ mode: UserEnums.RoleMode.Admin, territory: `root-${randSuffix}` });
        const t1_2_right = new UserRight({ mode: UserEnums.RoleMode.Admin, territory: `T1-2-${randSuffix}` });

        it("should find no right for empty array", () => {
            expect(cache.getRightForTerritory("T0", [])).toBeUndefined();
        });
        it("should find exact right for exact territory if provided in array", () => {
            expect(cache.getRightForTerritory("T0", [expectedProvided])).toEqual(expectedProvided);
        });
        it("should find the right for child territory derived from parent's", () => {
            expect(cache.getRightForTerritory(`T1-${randSuffix}`, [rootRight])).toEqual(rootRight);
        });
        it("should NOT find the right if not even in the parent chain", () => {
            expect(cache.getRightForTerritory(`T1-${randSuffix}`, [t1_2_right])).toEqual(undefined);
        });
    });
});
