import { testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import { findEntityById } from "@service/shorthands";
import Statement from "@models/statement/statement";
import { IReference } from "@shared/types";
import { pool } from "@middlewares/db";

describe("statements/references", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Empty/Invalid params", () => {
    it("should return a BadParams error wrapped in IResponseGeneric for empty params", async () => {
      await request(app)
        .put(`${apiPath}/statements/references`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing json data", async () => {
      await request(app)
        .put(`${apiPath}/statements/references?ids=1,2,3`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for missing ids", async () => {
      await request(app)
        .put(`${apiPath}/statements/references`)
        .send([{ id: "1", resource: "res", value: "val" } as IReference])
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("should return a BadParams error wrapped in IResponseGeneric for bad reference data", async () => {
      await request(app)
        .put(`${apiPath}/statements/references?ids=1,2,3`)
        .send([{ id: "", resource: "res", value: "val" } as IReference]) // empty id
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("Replace action", () => {
    const db = new Db();
    const randSuffix = Math.random().toString();

    beforeAll(async () => {
      await db.initDb();
    });

    afterAll(async () => {
      await db.close();
    });

    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric for invalid statements", async () => {
      await request(app)
        .put(
          `${apiPath}/statements/references?ids=shouldnotexist&action=replace`
        )
        .send([{ id: "1", resource: "res", value: "val" } as IReference])
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        );
    });

    it("should return a successful IResponseGeneric for valid ids and empty references (clear)", async () => {
      const statement1 = new Statement({
        references: [{ id: "1", resource: "res", value: "val" }],
      });
      const statement2 = new Statement({
        references: [{ id: "2", resource: "res", value: "val" }],
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const statement1Before = await findEntityById(db, statement1.id);
      const statement2Before = await findEntityById(db, statement2.id);
      expect(statement1Before.references).toHaveLength(1);
      expect(statement2Before.references).toHaveLength(1);

      const response = await request(app)
        .put(
          `${apiPath}/statements/references?ids=${statement1.id},${statement2.id}&replace=true`
        )
        .send([])
        .set("authorization", "Bearer " + supertestConfig.token);

      expect(response.body.result).toBeTruthy();

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.references).toHaveLength(0);
      expect(statement2After.references).toHaveLength(0);
    });

    it("should return a successful IResponseGeneric for valid ids and non-empty references (replace)", async () => {
      const statement1 = new Statement({
        references: [{ id: "1", resource: "res", value: "val" }],
      });
      const statement2 = new Statement({
        references: [{ id: "2", resource: "res", value: "val" }],
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const statement1Before = await findEntityById(db, statement1.id);
      const statement2Before = await findEntityById(db, statement2.id);
      expect(statement1Before.references).toHaveLength(1);
      expect(statement2Before.references).toHaveLength(1);

      const response = await request(app)
        .put(
          `${apiPath}/statements/references?ids=${statement1.id},${statement2.id}&replace=true`
        )
        .send([{ id: "3", resource: "res", value: "val" }])
        .set("authorization", "Bearer " + supertestConfig.token);

      expect(response.body.result).toBeTruthy();

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.references).toHaveLength(1);
      expect(statement1After.references.find((r) => r.id === "3")).toBeTruthy();

      expect(statement2After.references).toHaveLength(1);
      expect(statement2After.references.find((r) => r.id === "3")).toBeTruthy();
    });

    it("should return a successful IResponseGeneric for valid ids and provided empty reference data in body (append)", async () => {
      const statement1 = new Statement({
        references: [{ id: "1", resource: "res", value: "val" }],
      });
      const statement2 = new Statement({
        references: [{ id: "2", resource: "res", value: "val" }],
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const statement1Before = await findEntityById(db, statement1.id);
      const statement2Before = await findEntityById(db, statement2.id);
      expect(statement1Before.references).toHaveLength(1);
      expect(statement2Before.references).toHaveLength(1);

      const response = await request(app)
        .put(
          `${apiPath}/statements/references?ids=${statement1.id},${statement2.id}`
        )
        .send([])
        .set("authorization", "Bearer " + supertestConfig.token);

      expect(response.body.result).toBeTruthy();

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.references).toEqual(statement1Before.references);
      expect(statement2After.references).toEqual(statement2Before.references);
    });

    it("should return a successful IResponseGeneric for valid ids and provided single reference object in body (append)", async () => {
      const statement1 = new Statement({
        references: [{ id: "1", resource: "res", value: "val" }],
      });
      const statement2 = new Statement({
        references: [{ id: "2", resource: "res", value: "val" }],
      });
      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const statement1Before = await findEntityById(db, statement1.id);
      const statement2Before = await findEntityById(db, statement2.id);
      expect(statement1Before.references).toHaveLength(1);
      expect(statement2Before.references).toHaveLength(1);

      const response = await request(app)
        .put(
          `${apiPath}/statements/references?ids=${statement1.id},${statement2.id}`
        )
        .send([{ id: "3", resource: "res", value: "val" }])
        .set("authorization", "Bearer " + supertestConfig.token);

      expect(response.body.result).toBeTruthy();

      const statement1After = await findEntityById(db, statement1.id);
      const statement2After = await findEntityById(db, statement2.id);
      expect(statement1After.references).toHaveLength(2);
      expect(statement1After.references.find((r) => r.id === "1")).toBeTruthy();
      expect(statement1After.references.find((r) => r.id === "3")).toBeTruthy();

      expect(statement2After.references).toHaveLength(2);
      expect(statement2After.references.find((r) => r.id === "2")).toBeTruthy();
      expect(statement2After.references.find((r) => r.id === "3")).toBeTruthy();
    });
  });
});
