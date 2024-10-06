import { testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import Audit from "@models/audit/audit";

describe("modules/audits GET", function () {
  const db = new Db();
  const firstAudit1980 = new Audit({ date: new Date("1980") });
  const secondAudit1990 = new Audit({ date: new Date("1990") });
  const secondAudit2000 = new Audit({ date: new Date("2000") });

  beforeAll(async () => {
    await db.initDb();
    firstAudit1980.save(db.connection);
    secondAudit1990.save(db.connection);
    secondAudit2000.save(db.connection);
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("Without params", () => {
    it("should return a first audit nonetheless", async () => {
      const response = await request(app)
        .get(`${apiPath}/audits`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

      expect(new Date(response.body.data.date)).toEqual(firstAudit1980.date);
    });
  });

  describe("With specific date param", () => {
    it("should return a 2000 audit", async () => {
      const response = await request(app)
        .get(`${apiPath}/audits?from=2000`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

      expect(new Date(response.body.data.date)).toEqual(secondAudit2000.date);
    });
  });
});
