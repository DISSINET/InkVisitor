import "ts-jest";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { prepareEntity } from "./entity.test";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import EntityWarnings from "./warnings";
import { prepareRelation } from "@models/relation/relation.test";
import Action from "@models/action/action";

describe("models/entity/warnings", function () {
  describe("test hasSCLM", function () {
    const db = new Db();
    const [, actionEntity] = prepareEntity(EntityEnums.Class.Action);
    const [, sclmEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, entityWithSC] = prepareEntity(EntityEnums.Class.Concept);
    const [, superclass] = prepareRelation(RelationEnums.Type.Superclass);
    superclass.entityIds = [entityWithSC.id, "random"];

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

  describe("test hasISYNC", function () {
    const db = new Db();
    const [, actionEntity] = prepareEntity(EntityEnums.Class.Action);
    const [, conceptWithoutSyn] = prepareEntity(EntityEnums.Class.Concept);
    const [, entityWithoutSCSyn1] = prepareEntity(EntityEnums.Class.Concept);
    const [, entityWithoutSCSyn2] = prepareEntity(EntityEnums.Class.Concept);
    const [, synCloud1] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud1.entityIds = [entityWithoutSCSyn1.id, entityWithoutSCSyn2.id];

    const [, entityWithSCSyn1] = prepareEntity(EntityEnums.Class.Concept);
    entityWithSCSyn1.id = "entityWithSCSyn1";
    const [, entityWithSCSyn2] = prepareEntity(EntityEnums.Class.Concept);
    entityWithSCSyn2.id = "entityWithSCSyn2";
    const [, synCloud2] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud2.entityIds = [entityWithSCSyn1.id, entityWithSCSyn2.id];
    const equalSc = "someabstractsc1";
    const [, sc1] = prepareRelation(RelationEnums.Type.Superclass);
    sc1.entityIds = [entityWithSCSyn1.id, equalSc];
    const [, sc2] = prepareRelation(RelationEnums.Type.Superclass);
    sc2.entityIds = [entityWithSCSyn2.id, equalSc];

    const [, entityInequalSCSyn1] = prepareEntity(EntityEnums.Class.Concept);
    entityInequalSCSyn1.id = "entityInequalSCSyn1";
    const [, entityInequalSCSyn2] = prepareEntity(EntityEnums.Class.Concept);
    entityInequalSCSyn2.id = "entityInequalSCSyn2";
    const [, synCloud3] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud3.entityIds = [entityInequalSCSyn1.id, entityInequalSCSyn2.id];
    const equalSc2 = "someabstractsc2";
    const [, sc3] = prepareRelation(RelationEnums.Type.Superclass);
    sc3.entityIds = [entityInequalSCSyn1.id, equalSc2];

    beforeAll(async () => {
      await db.initDb();
      await actionEntity.save(db.connection);
      await conceptWithoutSyn.save(db.connection);
      await entityWithoutSCSyn1.save(db.connection);
      await entityWithoutSCSyn2.save(db.connection);
      await synCloud1.save(db.connection);

      await entityWithSCSyn1.save(db.connection);
      await entityWithSCSyn2.save(db.connection);
      await synCloud2.save(db.connection);
      await sc1.save(db.connection);
      await sc2.save(db.connection);

      await entityInequalSCSyn1.save(db.connection);
      await entityInequalSCSyn2.save(db.connection);
      await synCloud3.save(db.connection);
      await sc3.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore ISYNC for non-concept entity", async () => {
      const isync = await new EntityWarnings(
        actionEntity.id,
        actionEntity.class
      ).hasISYNC(db.connection);
      expect(isync).toBeFalsy();
    });

    it("should not find ISYNC warning for conceptWithoutSyn entity", async () => {
      const isync = await new EntityWarnings(
        conceptWithoutSyn.id,
        conceptWithoutSyn.class
      ).hasISYNC(db.connection);
      expect(isync).toBeFalsy();
    });

    it("should not find ISYNC warning for synonyms without SC", async () => {
      const isync1 = await new EntityWarnings(
        entityWithoutSCSyn1.id,
        entityWithoutSCSyn1.class
      ).hasISYNC(db.connection);
      expect(isync1).toBeFalsy();

      const isync2 = await new EntityWarnings(
        entityWithoutSCSyn2.id,
        entityWithoutSCSyn2.class
      ).hasISYNC(db.connection);
      expect(isync2).toBeFalsy();
    });

    it("should not find ISYNC warning for synonyms with equal SC", async () => {
      const isync1 = await new EntityWarnings(
        entityWithSCSyn1.id,
        entityWithSCSyn1.class
      ).hasISYNC(db.connection);
      expect(isync1).toBeFalsy();

      const isync2 = await new EntityWarnings(
        entityWithSCSyn2.id,
        entityWithSCSyn2.class
      ).hasISYNC(db.connection);
      expect(isync2).toBeFalsy();
    });

    it("should find ISYNC warning for synonyms with inequal SC", async () => {
      const isync1 = await new EntityWarnings(
        entityInequalSCSyn1.id,
        entityInequalSCSyn1.class
      ).hasISYNC(db.connection);
      expect(isync1).toBeTruthy();

      const isync2 = await new EntityWarnings(
        entityInequalSCSyn2.id,
        entityInequalSCSyn2.class
      ).hasISYNC(db.connection);
      expect(isync2).toBeTruthy();
    });
  });

  describe("test hasMVAL", function () {
    const db = new Db();
    const [, conceptEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, actionInvalid] = prepareEntity(EntityEnums.Class.Action);
    const actionValid = new Action({
      data: {
        entities: {
          a1: [],
          a2: [],
          s: [],
        },
        valencies: {
          a1: "",
          a2: "",
          s: "",
        },
        pos: EntityEnums.ActionPartOfSpeech.Verb,
      },
    });

    beforeAll(async () => {
      await db.initDb();
      await conceptEntity.save(db.connection);
      await actionInvalid.save(db.connection);
      await actionValid.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore MVAL for non-actin entity", async () => {
      const mval = await new EntityWarnings(
        conceptEntity.id,
        conceptEntity.class
      ).hasMVAL(db.connection);
      expect(mval).toBeFalsy();
    });

    it("should have MVAL for invalid valencies", async () => {
      const mval = await new EntityWarnings(
        actionInvalid.id,
        actionInvalid.class
      ).hasMVAL(db.connection);
      expect(mval).toBeTruthy();
    });

    it("should not have MVAL if all valency fields are set", async () => {
      const mval = await new EntityWarnings(
        actionValid.id,
        actionValid.class
      ).hasMVAL(db.connection);
      expect(mval).toBeFalsy();
    });
  });

  describe("test hasMAEE", function () {
    const db = new Db();
    const [, conceptEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, actionInvalid] = prepareEntity(EntityEnums.Class.Action);
    const [, actionValid] = prepareEntity(EntityEnums.Class.Action);
    const [, aee] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee.entityIds = [actionValid.id, "somerandomid"];

    beforeAll(async () => {
      await db.initDb();
      await conceptEntity.save(db.connection);
      await actionInvalid.save(db.connection);
      await actionValid.save(db.connection);
      await aee.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore MAEE for non-action entity", async () => {
      const maee = await new EntityWarnings(
        conceptEntity.id,
        conceptEntity.class
      ).hasMAEE(db.connection);
      expect(maee).toBeFalsy();
    });

    it("should have MAEE for action without AEE", async () => {
      const maee = await new EntityWarnings(
        actionInvalid.id,
        actionInvalid.class
      ).hasMAEE(db.connection);
      expect(maee).toBeTruthy();
    });

    it("should not have MAEE for action with AEE", async () => {
      const maee = await new EntityWarnings(
        actionValid.id,
        actionValid.class
      ).hasMAEE(db.connection);
      expect(maee).toBeFalsy();
    });
  });

  describe("test hasAVAL", function () {
    const db = new Db();
    const [, actionEntity] = prepareEntity(EntityEnums.Class.Action);
    const [, aee] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee.entityIds = [actionEntity.id, "random"];

    beforeAll(async () => {
      await db.initDb();
      await aee.save(db.connection);
      await actionEntity.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should test 1", async () => {
      const sclm = await new EntityWarnings(
        actionEntity.id,
        actionEntity.class
      ).hasAVAL(db.connection);
      expect(sclm).toBeFalsy();
    });
  });
});
