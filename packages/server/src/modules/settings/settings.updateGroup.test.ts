import { testErroneousResponse } from "@modules/common.test";
import { BadParams, NotFound } from "@inkvisitor/shared/types/errors";
import { apiPath } from "@common/constants";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import { SettingGroupDict } from "@inkvisitor/shared/dictionaries/settinggroup";
import { globalValidationsDict } from "@inkvisitor/shared/enums/warning";
import { Setting } from "@models/setting/setting";
import { getAuthenticatedAgent } from "@modules/testAuth";

describe("Settings updateGroup", function () {
  const db = new Db();
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    await db.initDb();
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("Not existing group param", () => {
    it("should return a NotFound error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/settings/group/1224hjk`)
        .expect(testErroneousResponse.bind(undefined, new NotFound("", "")));
    });
  });

  describe("Existing group id", () => {
    it("should return a 200 code even if not found setting entry id", async () => {
      await authAgent
        .put(`${apiPath}/settings/group/${SettingGroupDict[0].id}`)
        .send([{ id: "nonexisting" }])
        .expect(200);
    });

    it("should return a 200 code for updating 2 entries", async () => {
      const id1 = Object.keys(globalValidationsDict)[0];
      const value1 = Math.random();
      const id2 = Object.keys(globalValidationsDict)[1];
      const value2 = Math.random();
      await authAgent
        .put(`${apiPath}/settings/group/${SettingGroupDict[0].id}`)
        .send([
          { id: id1, value: value1 },
          { id: id2, value: value2 },
        ])
        .expect(200);

      const updated1 = await Setting.getSetting(db.connection, id1);
      const updated2 = await Setting.getSetting(db.connection, id2);
      expect(updated1?.value).toEqual(value1);
      expect(updated2?.value).toEqual(value2);
    });
  });
});
