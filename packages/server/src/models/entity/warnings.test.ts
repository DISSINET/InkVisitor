import "ts-jest";
import Statement, {
  StatementActant,
  StatementAction,
  StatementClassification,
  StatementData,
  StatementIdentification,
} from "@models/statement/statement";
import { ResponseEntityDetail } from "./response";
import { EntityEnums, RelationEnums } from "@shared/enums";
import Entity from "./entity";
import { prepareStatement } from "@models/statement/statement.test";
import {
  IResponseUsedInStatementClassification,
  IResponseUsedInStatementIdentification,
} from "@shared/types/response-detail";
import { IStatement } from "@shared/types";
import { prepareEntity } from "./entity.test";
import { Db } from "@service/RethinkDB";
import { clean } from "@modules/common.test";
import EntityWarnings from "./warnings";
import { prepareRelation } from "@models/relation/relation.test";

describe("models/entity/warnings", function () {
  describe("test hasSCLM", function () {
    const db = new Db();
    const [, actionEntity] = prepareEntity(EntityEnums.Class.Action);
    const [, sclmEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, entityWithSC] = prepareEntity(EntityEnums.Class.Concept);
    const [, superclass] = prepareRelation(RelationEnums.Type.Superclass);
    superclass.entityIds = ["random", entityWithSC.id];

    beforeAll(async () => {
      await db.initDb();
      await sclmEntity.save(db.connection);
      await actionEntity.save(db.connection);

      await superclass.save(db.connection);
      await entityWithSC.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore SCLM for non-concept entity", async () => {
      const sclm = await new EntityWarnings(
        actionEntity.id,
        actionEntity.class
      ).hasSCLM(db.connection);
      expect(sclm).toBeFalsy();
    });

    it("should find SCLM warning for entity 1", async () => {
      const sclm = await new EntityWarnings(
        sclmEntity.id,
        sclmEntity.class
      ).hasSCLM(db.connection);
      expect(sclm).toBeTruthy();
    });

    it("should not find SCLM warning for entity 2", async () => {
      const sclm = await new EntityWarnings(
        entityWithSC.id,
        entityWithSC.class
      ).hasSCLM(db.connection);
      expect(sclm).toBeFalsy();
    });
  });
});
