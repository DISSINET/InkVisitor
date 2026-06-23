import "ts-jest";
import { ResponseStats } from "./response";
import { IRequestStats } from "@inkvisitor/shared/types/request-stats";
import Acl from "@middlewares/acl";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { IRequest } from "src/custom_typings/request";
import { newMockRequest } from "@modules/common.test";

describe("test ResponseStats.prepare", function () {
  describe("empty test", () => {
    const db = new Db();
    // Constructor only reads the IStatsAggregationParams fields (all defaulted);
    // the required `filter` is unused here, so an empty params object is fine.
    const response = new ResponseStats({} as unknown as IRequestStats);
    const request = newMockRequest(db);

    beforeAll(async () => {
      await db.initDb();
    });

    it("should end without error", async () => {
      let err: any;
      try {
        await response.prepare(request);
      } catch (e) {
        err = e;
      }

      expect(err).toBeUndefined();
    });
  });
});
