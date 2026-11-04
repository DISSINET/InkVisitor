import { testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/storage";
import { pool } from "@middlewares/db";
import Audit from "@models/audit/audit";

describe("modules/audits GET", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  const db = new Db();
  const firstAudit1980 = new Audit({ user: "1", date: new Date("1980") });
  const secondAudit1990 = new Audit({ user: "1", date: new Date("1990") });
  const secondAudit2000 = new Audit({ user: "1", date: new Date("2000") });

  beforeAll(async () => {
    await db.initDb();
    await firstAudit1980.save(db.connection);
    await secondAudit1990.save(db.connection);
    await secondAudit2000.save(db.connection);
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("Without params", () => {
    it("should return a first audit nonetheless", async () => {
      const response = await authAgent
        .get(`${apiPath}/audits`)
        .expect(200);

      expect(new Date(response.body.data.date)).toEqual(firstAudit1980.date);
    });
  });

  describe("With specific date param", () => {
    it("should return a 2000 audit", async () => {
      const response = await authAgent
        .get(`${apiPath}/audits?from=2000`)
        .expect(200);

      expect(new Date(response.body.data.date)).toEqual(secondAudit2000.date);
    });
  });
});
