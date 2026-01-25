import "ts-jest";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { prepareEntity } from "./entity.test";
import { Db } from "@service/rethink";
import { clean } from "@modules/common.test";
import EntityWarnings from "./warnings";
import { prepareRelation } from "@models/relation/relation.test";
import Action from "@models/action/action";
import Concept from "@models/concept/concept";

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

    // Concepts with asymmetric SCL (one has SCL, other doesn't)
    const [, entityInequalSCSyn1] = prepareEntity(EntityEnums.Class.Concept);
    entityInequalSCSyn1.id = "entityInequalSCSyn1";
    const [, entityInequalSCSyn2] = prepareEntity(EntityEnums.Class.Concept);
    entityInequalSCSyn2.id = "entityInequalSCSyn2";
    const [, synCloud3] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud3.entityIds = [entityInequalSCSyn1.id, entityInequalSCSyn2.id];
    const equalSc2 = "someabstractsc2";
    const [, sc3] = prepareRelation(RelationEnums.Type.Superclass);
    sc3.entityIds = [entityInequalSCSyn1.id, equalSc2];

    // Concepts with different SCL targets that are synonyms of each other (should NOT trigger warning)
    const [, entitySynSCTarget1] = prepareEntity(EntityEnums.Class.Concept);
    entitySynSCTarget1.id = "entitySynSCTarget1";
    const [, entitySynSCTarget2] = prepareEntity(EntityEnums.Class.Concept);
    entitySynSCTarget2.id = "entitySynSCTarget2";
    const [, synCloud4] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud4.entityIds = [entitySynSCTarget1.id, entitySynSCTarget2.id];
    // Create two different SC targets that are synonyms
    const scTargetA = "scTargetA";
    const scTargetB = "scTargetB";
    const [, scTargetSynRel] = prepareRelation(RelationEnums.Type.Synonym);
    scTargetSynRel.entityIds = [scTargetA, scTargetB];
    const [, sc4] = prepareRelation(RelationEnums.Type.Superclass);
    sc4.entityIds = [entitySynSCTarget1.id, scTargetA];
    const [, sc5] = prepareRelation(RelationEnums.Type.Superclass);
    sc5.entityIds = [entitySynSCTarget2.id, scTargetB];

    // Concepts with different SCL targets that are NOT synonyms (should trigger warning)
    const [, entityNonSynSCTarget1] = prepareEntity(EntityEnums.Class.Concept);
    entityNonSynSCTarget1.id = "entityNonSynSCTarget1";
    const [, entityNonSynSCTarget2] = prepareEntity(EntityEnums.Class.Concept);
    entityNonSynSCTarget2.id = "entityNonSynSCTarget2";
    const [, synCloud5] = prepareRelation(RelationEnums.Type.Synonym);
    synCloud5.entityIds = [entityNonSynSCTarget1.id, entityNonSynSCTarget2.id];
    const scTargetC = "scTargetC";
    const scTargetD = "scTargetD"; // Not a synonym of scTargetC
    const [, sc6] = prepareRelation(RelationEnums.Type.Superclass);
    sc6.entityIds = [entityNonSynSCTarget1.id, scTargetC];
    const [, sc7] = prepareRelation(RelationEnums.Type.Superclass);
    sc7.entityIds = [entityNonSynSCTarget2.id, scTargetD];

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

      // Save entities with synonym SCL targets
      await entitySynSCTarget1.save(db.connection);
      await entitySynSCTarget2.save(db.connection);
      await synCloud4.save(db.connection);
      await scTargetSynRel.save(db.connection);
      await sc4.save(db.connection);
      await sc5.save(db.connection);

      // Save entities with non-synonym SCL targets
      await entityNonSynSCTarget1.save(db.connection);
      await entityNonSynSCTarget2.save(db.connection);
      await synCloud5.save(db.connection);
      await sc6.save(db.connection);
      await sc7.save(db.connection);
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

    it("should find ISYNC warning for synonyms with asymmetric SC (one has, one doesn't)", async () => {
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

    it("should not find ISYNC warning for synonyms with different SC targets that are synonyms", async () => {
      const isync1 = await new EntityWarnings(
        entitySynSCTarget1.id,
        entitySynSCTarget1.class
      ).hasISYNC(db.connection);
      expect(isync1).toBeFalsy();

      const isync2 = await new EntityWarnings(
        entitySynSCTarget2.id,
        entitySynSCTarget2.class
      ).hasISYNC(db.connection);
      expect(isync2).toBeFalsy();
    });

    it("should find ISYNC warning for synonyms with different SC targets that are NOT synonyms", async () => {
      const isync1 = await new EntityWarnings(
        entityNonSynSCTarget1.id,
        entityNonSynSCTarget1.class
      ).hasISYNC(db.connection);
      expect(isync1).toBeTruthy();

      const isync2 = await new EntityWarnings(
        entityNonSynSCTarget2.id,
        entityNonSynSCTarget2.class
      ).hasISYNC(db.connection);
      expect(isync2).toBeTruthy();
    });
  });

  describe("test hasISYNCAEE", function () {
    const db = new Db();
    const [, conceptEntity] = prepareEntity(EntityEnums.Class.Concept);
    const [, actionWithoutSyn] = prepareEntity(EntityEnums.Class.Action);

    // Actions without AEE (both have no AEE - should NOT trigger warning)
    const [, actionWithoutAEESyn1] = prepareEntity(EntityEnums.Class.Action);
    actionWithoutAEESyn1.id = "actionWithoutAEESyn1";
    const [, actionWithoutAEESyn2] = prepareEntity(EntityEnums.Class.Action);
    actionWithoutAEESyn2.id = "actionWithoutAEESyn2";
    const [, synCloudA1] = prepareRelation(RelationEnums.Type.Synonym);
    synCloudA1.entityIds = [actionWithoutAEESyn1.id, actionWithoutAEESyn2.id];

    // Actions with same AEE target (should NOT trigger warning)
    const [, actionWithSameAEE1] = prepareEntity(EntityEnums.Class.Action);
    actionWithSameAEE1.id = "actionWithSameAEE1";
    const [, actionWithSameAEE2] = prepareEntity(EntityEnums.Class.Action);
    actionWithSameAEE2.id = "actionWithSameAEE2";
    const [, synCloudA2] = prepareRelation(RelationEnums.Type.Synonym);
    synCloudA2.entityIds = [actionWithSameAEE1.id, actionWithSameAEE2.id];
    const sameEventId = "sameEventId";
    const [, aee1] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee1.entityIds = [actionWithSameAEE1.id, sameEventId];
    const [, aee2] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee2.entityIds = [actionWithSameAEE2.id, sameEventId];

    // Actions with asymmetric AEE (one has, one doesn't - should trigger warning)
    const [, actionAsymAEE1] = prepareEntity(EntityEnums.Class.Action);
    actionAsymAEE1.id = "actionAsymAEE1";
    const [, actionAsymAEE2] = prepareEntity(EntityEnums.Class.Action);
    actionAsymAEE2.id = "actionAsymAEE2";
    const [, synCloudA3] = prepareRelation(RelationEnums.Type.Synonym);
    synCloudA3.entityIds = [actionAsymAEE1.id, actionAsymAEE2.id];
    const [, aee3] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee3.entityIds = [actionAsymAEE1.id, "someEventId"];

    // Actions with different AEE targets that ARE synonyms (should NOT trigger warning)
    const [, actionSynAEE1] = prepareEntity(EntityEnums.Class.Action);
    actionSynAEE1.id = "actionSynAEE1";
    const [, actionSynAEE2] = prepareEntity(EntityEnums.Class.Action);
    actionSynAEE2.id = "actionSynAEE2";
    const [, synCloudA4] = prepareRelation(RelationEnums.Type.Synonym);
    synCloudA4.entityIds = [actionSynAEE1.id, actionSynAEE2.id];
    const eventTargetA = "eventTargetA";
    const eventTargetB = "eventTargetB";
    const [, eventSynRel] = prepareRelation(RelationEnums.Type.Synonym);
    eventSynRel.entityIds = [eventTargetA, eventTargetB];
    const [, aee4] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee4.entityIds = [actionSynAEE1.id, eventTargetA];
    const [, aee5] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee5.entityIds = [actionSynAEE2.id, eventTargetB];

    // Actions with different AEE targets that are NOT synonyms (should trigger warning)
    const [, actionNonSynAEE1] = prepareEntity(EntityEnums.Class.Action);
    actionNonSynAEE1.id = "actionNonSynAEE1";
    const [, actionNonSynAEE2] = prepareEntity(EntityEnums.Class.Action);
    actionNonSynAEE2.id = "actionNonSynAEE2";
    const [, synCloudA5] = prepareRelation(RelationEnums.Type.Synonym);
    synCloudA5.entityIds = [actionNonSynAEE1.id, actionNonSynAEE2.id];
    const eventTargetC = "eventTargetC";
    const eventTargetD = "eventTargetD"; // Not a synonym of eventTargetC
    const [, aee6] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee6.entityIds = [actionNonSynAEE1.id, eventTargetC];
    const [, aee7] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    aee7.entityIds = [actionNonSynAEE2.id, eventTargetD];

    beforeAll(async () => {
      await db.initDb();
      await conceptEntity.save(db.connection);
      await actionWithoutSyn.save(db.connection);

      // Save actions without AEE
      await actionWithoutAEESyn1.save(db.connection);
      await actionWithoutAEESyn2.save(db.connection);
      await synCloudA1.save(db.connection);

      // Save actions with same AEE
      await actionWithSameAEE1.save(db.connection);
      await actionWithSameAEE2.save(db.connection);
      await synCloudA2.save(db.connection);
      await aee1.save(db.connection);
      await aee2.save(db.connection);

      // Save actions with asymmetric AEE
      await actionAsymAEE1.save(db.connection);
      await actionAsymAEE2.save(db.connection);
      await synCloudA3.save(db.connection);
      await aee3.save(db.connection);

      // Save actions with synonym AEE targets
      await actionSynAEE1.save(db.connection);
      await actionSynAEE2.save(db.connection);
      await synCloudA4.save(db.connection);
      await eventSynRel.save(db.connection);
      await aee4.save(db.connection);
      await aee5.save(db.connection);

      // Save actions with non-synonym AEE targets
      await actionNonSynAEE1.save(db.connection);
      await actionNonSynAEE2.save(db.connection);
      await synCloudA5.save(db.connection);
      await aee6.save(db.connection);
      await aee7.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore ISYNCAEE for non-action entity", async () => {
      const isyncaee = await new EntityWarnings(
        conceptEntity.id,
        conceptEntity.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee).toBeFalsy();
    });

    it("should not find ISYNCAEE warning for action without synonyms", async () => {
      const isyncaee = await new EntityWarnings(
        actionWithoutSyn.id,
        actionWithoutSyn.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee).toBeFalsy();
    });

    it("should not find ISYNCAEE warning for synonyms without AEE", async () => {
      const isyncaee1 = await new EntityWarnings(
        actionWithoutAEESyn1.id,
        actionWithoutAEESyn1.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee1).toBeFalsy();

      const isyncaee2 = await new EntityWarnings(
        actionWithoutAEESyn2.id,
        actionWithoutAEESyn2.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee2).toBeFalsy();
    });

    it("should not find ISYNCAEE warning for synonyms with same AEE target", async () => {
      const isyncaee1 = await new EntityWarnings(
        actionWithSameAEE1.id,
        actionWithSameAEE1.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee1).toBeFalsy();

      const isyncaee2 = await new EntityWarnings(
        actionWithSameAEE2.id,
        actionWithSameAEE2.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee2).toBeFalsy();
    });

    it("should find ISYNCAEE warning for synonyms with asymmetric AEE (one has, one doesn't)", async () => {
      const isyncaee1 = await new EntityWarnings(
        actionAsymAEE1.id,
        actionAsymAEE1.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee1).toBeTruthy();

      const isyncaee2 = await new EntityWarnings(
        actionAsymAEE2.id,
        actionAsymAEE2.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee2).toBeTruthy();
    });

    it("should not find ISYNCAEE warning for synonyms with different AEE targets that are synonyms", async () => {
      const isyncaee1 = await new EntityWarnings(
        actionSynAEE1.id,
        actionSynAEE1.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee1).toBeFalsy();

      const isyncaee2 = await new EntityWarnings(
        actionSynAEE2.id,
        actionSynAEE2.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee2).toBeFalsy();
    });

    it("should find ISYNCAEE warning for synonyms with different AEE targets that are NOT synonyms", async () => {
      const isyncaee1 = await new EntityWarnings(
        actionNonSynAEE1.id,
        actionNonSynAEE1.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee1).toBeTruthy();

      const isyncaee2 = await new EntityWarnings(
        actionNonSynAEE2.id,
        actionNonSynAEE2.class
      ).hasISYNCAEE(db.connection);
      expect(isyncaee2).toBeTruthy();
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

  describe("test hasPSM", function () {
    const db = new Db();
    const conceptEntityWithEmptyPos = new Concept({
      data: { pos: EntityEnums.ConceptPartOfSpeech.Empty },
    });
    const conceptEntityWithoutEmptyPos = new Concept({
      data: { pos: EntityEnums.ConceptPartOfSpeech.Adj },
    });
    const [, actionInvalid] = prepareEntity(EntityEnums.Class.Action);

    beforeAll(async () => {
      await db.initDb();
      await conceptEntityWithEmptyPos.save(db.connection);
      await conceptEntityWithoutEmptyPos.save(db.connection);
      await actionInvalid.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should ignore PSM for non-concept entity", async () => {
      const psm = await new EntityWarnings(
        actionInvalid.id,
        actionInvalid.class
      ).hasPSM(db.connection);
      expect(psm).toBeFalsy();
    });

    it("should have PSM for concept entity with empty pos", async () => {
      const psm = await new EntityWarnings(
        conceptEntityWithEmptyPos.id,
        conceptEntityWithEmptyPos.class
      ).hasPSM(db.connection);
      expect(psm).toBeTruthy();
    });

    it("should have not PSM for concept entity with filled pos", async () => {
      const psm = await new EntityWarnings(
        conceptEntityWithoutEmptyPos.id,
        conceptEntityWithoutEmptyPos.class
      ).hasPSM(db.connection);
      expect(psm).toBeFalsy();
    });
  });

  describe("test hasLM", function () {
    const db = new Db();
    const [, actionWithEmptyLanguage] = prepareEntity(EntityEnums.Class.Action);
    actionWithEmptyLanguage.language = EntityEnums.Language.Empty;
    const [, conceptWithSetLanguage] = prepareEntity(EntityEnums.Class.Concept);
    conceptWithSetLanguage.language = EntityEnums.Language.English;

    beforeAll(async () => {
      await db.initDb();
      await actionWithEmptyLanguage.save(db.connection);
      await conceptWithSetLanguage.save(db.connection);
    });
  });

  describe("test VETV", function () {
    const db = new Db();

    const [, actionEntity0] = prepareEntity(EntityEnums.Class.Action);
    const [, actionEntity1] = prepareEntity(EntityEnums.Class.Action);
    const [, actionEntity2] = prepareEntity(EntityEnums.Class.Action);

    actionEntity0.data = {
      entities: {
        a1: [EntityEnums.Extension.Empty],
        a2: [EntityEnums.Extension.Any],
        s: [EntityEnums.Class.Action],
      },
    };

    actionEntity1.data = {
      entities: {
        a1: [EntityEnums.Extension.Empty],
        a2: [],
        s: [EntityEnums.Class.Action],
      },
    };
    actionEntity2.data = {
      entities: {
        a1: [
          EntityEnums.Extension.Empty,
          EntityEnums.Extension.Any,
          EntityEnums.Class.Action,
        ],
        a2: [],
        s: [],
      },
    };

    beforeAll(async () => {
      await db.initDb();
      await actionEntity0.save(db.connection);
      await actionEntity1.save(db.connection);
      await actionEntity2.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should have LM for entity without language", async () => {
      const psm = await new EntityWarnings(
        actionEntity0.id,
        actionEntity0.class
      ).hasLM(db.connection);
      expect(psm).toBeTruthy();
    });

    it("should have not LM for entity with language", async () => {
      const psm = await new EntityWarnings(
        actionEntity1.id,
        actionEntity1.class
      ).hasLM(db.connection);
      expect(psm).toBeFalsy();
    });

    it("should return 0 warnings", async () => {
      const warnings = await new EntityWarnings(
        actionEntity0.id,
        actionEntity0.class
      ).hasVETM(db.connection);
      expect(warnings).toHaveLength(0);
    });

    it("should return 1 warning", async () => {
      const warnings = await new EntityWarnings(
        actionEntity1.id,
        actionEntity1.class
      ).hasVETM(db.connection);
      expect(warnings).toHaveLength(1);
    });

    it("should return 2 warnings", async () => {
      const warnings = await new EntityWarnings(
        actionEntity2.id,
        actionEntity2.class
      ).hasVETM(db.connection);
      expect(warnings).toHaveLength(2);
    });
  });
});
