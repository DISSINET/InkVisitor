import "ts-jest";
import { ResponseStats } from "./response";
import Acl from "@middlewares/acl";
import { Db } from "@service/RethinkDB";
import User from "@models/user/user";
import { IRequest } from "src/custom.request";

describe("test ResponseStats.prepare", function () {
  describe("empty test", () => {
    const db = new Db();
    const response = new ResponseStats();
    const request: IRequest = {
      acl: new Acl(),
      db: db,
      getUserOrFail: () => {
        return new User({});
      },
    };

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
