import request from "supertest";
import app from "../../server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import { MaterializedStats } from "@models/stats/materialized-stats";
import { EventType, Aggregation, TimeUnit } from "@inkvisitor/shared/types/stats";

describe("modules/stats materialized endpoint", function () {
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

  describe("POST /stats/materialized", () => {
    it("should return empty data when no materialized data exists", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        toDate: new Date("2023-01-31").getTime(),
        timeUnit: TimeUnit.DAY,
        aggregateBy: Aggregation.USER,
        eventType: [EventType.EDIT, EventType.DELETE, EventType.CREATE],
        filter: {
          userIds: "all",
          editActivities: {
            entities: true,
            relationsMeta: true,
            relationsStatement: true,
            propsMeta: true,
            propsStatement: true,
            references: true,
            tags: true,
          },
          entityTypes: "all",
          relationTypes: "all",
        },
      };

      const response = await authAgent
        .post(`${apiPath}/stats/materialized`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty("fromDate", requestBody.fromDate);
      expect(response.body).toHaveProperty("toDate", requestBody.toDate);
      expect(response.body).toHaveProperty("timeUnit", requestBody.timeUnit);
      expect(response.body).toHaveProperty("aggregateBy", requestBody.aggregateBy);
      expect(response.body).toHaveProperty("eventType", requestBody.eventType);
      expect(response.body).toHaveProperty("values");
      expect(typeof response.body.values).toBe("object");
    });

    it("should fall back to original endpoint for specific filters", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        toDate: new Date("2023-01-31").getTime(),
        timeUnit: TimeUnit.DAY,
        aggregateBy: Aggregation.USER,
        eventType: [EventType.EDIT],
        filter: {
          userIds: ["specific-user-id"], // Not "all"
          editActivities: {
            entities: true,
            relationsMeta: true,
            relationsStatement: true,
            propsMeta: true,
            propsStatement: true,
            references: true,
            tags: true,
          },
          entityTypes: "all",
          relationTypes: "all",
        },
      };

      const response = await authAgent
        .post(`${apiPath}/stats/materialized`)
        .send(requestBody)
        .expect(200);

      // Should still return a valid response (fallback to original endpoint)
      expect(response.body).toHaveProperty("fromDate", requestBody.fromDate);
      expect(response.body).toHaveProperty("toDate", requestBody.toDate);
      expect(response.body).toHaveProperty("timeUnit", requestBody.timeUnit);
      expect(response.body).toHaveProperty("aggregateBy", requestBody.aggregateBy);
      expect(response.body).toHaveProperty("eventType", requestBody.eventType);
      expect(response.body).toHaveProperty("values");
    });

    it("should return materialized data when available", async () => {
      // First, insert some test materialized data
      const testData = new MaterializedStats({
        id: MaterializedStats.generateId("2023-01-15", EventType.EDIT, Aggregation.USER, "test-user"),
        date: "2023-01-15",
        eventType: EventType.EDIT,
        aggregateBy: Aggregation.USER,
        aggregationKey: "test-user",
        count: 5,
        lastUpdated: new Date(),
      });

      await testData.save(db.connection, TimeUnit.DAY);

      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        toDate: new Date("2023-01-31").getTime(),
        timeUnit: TimeUnit.DAY,
        aggregateBy: Aggregation.USER,
        eventType: [EventType.EDIT],
        filter: {
          userIds: "all",
          editActivities: {
            entities: true,
            relationsMeta: true,
            relationsStatement: true,
            propsMeta: true,
            propsStatement: true,
            references: true,
            tags: true,
          },
          entityTypes: "all",
          relationTypes: "all",
        },
      };

      const response = await authAgent
        .post(`${apiPath}/stats/materialized`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty("values");
      expect(response.body.values).toHaveProperty("2023-01-15");
      expect(response.body.values["2023-01-15"]).toHaveProperty("test-user", 5);
    });
  });

  describe("POST /stats/aggregate", () => {
    it("should aggregate data for a specific date range", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        toDate: new Date("2023-01-02").getTime(),
        timeUnits: [TimeUnit.DAY],
        aggregateBy: [Aggregation.USER],
      };

      const response = await authAgent
        .post(`${apiPath}/stats/aggregate`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("recordsProcessed");
      expect(typeof response.body.recordsProcessed).toBe("number");
      expect(response.body.message).toContain("Successfully aggregated stats data");
    });

    it("should require fromDate and toDate", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        // Missing toDate
      };

      await authAgent
        .post(`${apiPath}/stats/aggregate`)
        .send(requestBody)
        .expect(500); // Should throw an error
    });

    it("should validate that fromDate is before toDate", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-02").getTime(),
        toDate: new Date("2023-01-01").getTime(), // After fromDate
      };

      await authAgent
        .post(`${apiPath}/stats/aggregate`)
        .send(requestBody)
        .expect(500); // Should throw an error
    });

    it("should use default timeUnits and aggregateBy when not specified", async () => {
      const requestBody = {
        fromDate: new Date("2023-01-01").getTime(),
        toDate: new Date("2023-01-02").getTime(),
        // No timeUnits or aggregateBy specified
      };

      const response = await authAgent
        .post(`${apiPath}/stats/aggregate`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("4 time units"); // All time units
      expect(response.body.message).toContain("2 aggregation types"); // Both aggregation types
    });
  });
});
