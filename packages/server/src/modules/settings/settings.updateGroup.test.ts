import { testErroneousResponse } from "@modules/common.test";
import { BadParams, NotFound, UserDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { createEntity } from "@service/shorthands";
import { Db } from "@service/rethink";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { supertestConfig } from "..";
import User from "@models/user/user";
import { IBookmarkFolder } from "@shared/types";
import { pool } from "@middlewares/db";
import { SettingGroupDict } from "@shared/dictionaries/settinggroup";
import { globalValidationsDict } from "@shared/enums/warning";
import { Setting } from "@models/setting/setting";

describe("Settings updateGroup", function () {
  const db = new Db();

  beforeAll(async () => {
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("Not existing group param", () => {
    it("should return a NotFound error wrapped in IResponseGeneric", async () => {
      console.log(supertestConfig.token);
      await request(app)
        .put(`${apiPath}/settings/group/1224hjk`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new NotFound("", "")));
    });
  });

  describe("Existing group id", () => {
    it("should return a 200 code even if not found setting entry id", async () => {
      await request(app)
        .put(`${apiPath}/settings/group/${SettingGroupDict[0].id}`)
        .send([{ id: "nonexisting" }])
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);
    });

    it("should return a 200 code for updating 2 entries", async () => {
      const id1 = Object.keys(globalValidationsDict)[0];
      const value1 = Math.random();
      const id2 = Object.keys(globalValidationsDict)[1];
      const value2 = Math.random();
      await request(app)
        .put(`${apiPath}/settings/group/${SettingGroupDict[0].id}`)
        .send([
          { id: id1, value: value1 },
          { id: id2, value: value2 },
        ])
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

      const updated1 = await Setting.getSetting(db.connection, id1);
      const updated2 = await Setting.getSetting(db.connection, id2);
      expect(updated1?.value).toEqual(value1);
      expect(updated2?.value).toEqual(value2);
    });
  });
});
