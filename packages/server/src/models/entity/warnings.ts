import Classification from "@models/relation/classification";
import Relation from "@models/relation/relation";
import Superclass from "@models/relation/superclass";
import { Setting } from "@models/setting/setting";
import { findEntityById, getEntitiesByIds } from "@service/shorthands";
import { EntityEnums, RelationEnums, WarningTypeEnums } from "@shared/enums";
import {
  IAction,
  IConcept,
  IEntity,
  ITerritory,
  IWarning,
} from "@shared/types";
import { IActionValency } from "@shared/types/action";
import { InternalServerError } from "@shared/types/errors";
import { PropSpecKind } from "@shared/types/prop";
import { IWarningPositionSection } from "@shared/types/warning";
import { Connection } from "rethinkdb-ts";
import Entity from "./entity";

export default class EntityWarnings {
  entityId: string;
  class: EntityEnums.Class;

  constructor(entityId: string, entityClass: EntityEnums.Class) {
    this.entityId = entityId;
    this.class = entityClass;
  }

  /**
   * Shorthand for creating new warning
   * @param warningType
   * @param relId
   * @returns new instance of warning
   */
  newWarning(
    warningType: WarningTypeEnums,
    section: IWarningPositionSection,
    pos?: keyof IActionValency
  ): IWarning {
    return {
      type: warningType,
      position: {
        section: section,
        subSection: pos,
      },
      origin: "",
    };
  }

  /**
   * prepares warning instances for current response object
   * @param conn
   * @returns
   */
  async getWarnings(conn: Connection): Promise<IWarning[]> {
    const settings = await Setting.getSettingsAll(conn);

    const warnings: IWarning[] = [];

    if (settings.find((s) => s.id === "validation_SCLM")?.value === true) {
      const sclmWarning = await this.hasSCLM(conn);
      if (sclmWarning) {
        warnings.push(sclmWarning);
      }
    }

    if (settings.find((s) => s.id === "validation_MAEE")?.value === true) {
      const maeeWarning = await this.hasMAEE(conn);
      if (maeeWarning) {
        warnings.push(maeeWarning);
      }
    }

    // these rules cannot be disabled
    const isyncWarning = await this.hasISYNC(conn);
    if (isyncWarning) {
      warnings.push(isyncWarning);
    }

    const isyncaeeWarning = await this.hasISYNCAEE(conn);
    if (isyncaeeWarning) {
      warnings.push(isyncaeeWarning);
    }

    const avalWarnings = await this.hasAVAL(conn);
    if (avalWarnings) {
      avalWarnings.forEach((w) => warnings.push(w));
    }

    const mvalWarning = await this.hasMVAL(conn);
    if (mvalWarning) {
      warnings.push(mvalWarning);
    }

    const psmWarning = await this.hasPSM(conn);
    if (psmWarning) {
      warnings.push(psmWarning);
    }

    const lmWarning = await this.hasLM(conn);
    if (lmWarning) {
      warnings.push(lmWarning);
    }

    const vetmWarnings = await this.hasVETM(conn);
    if (vetmWarnings) {
      vetmWarnings.forEach((w) => warnings.push(w));
    }

    return warnings;
  }

  async getTBasedWarnings(
    conn: Connection,
    entity: Entity,
    rootTerritory: ITerritory
  ): Promise<IWarning[]> {
    const settings = await Setting.getSettingsAll(conn);
    const classificationRels =
      await Classification.getClassificationForwardConnections(
        conn,
        entity.id,
        entity.class,
        1,
        0
      );

    const soeRels = await Relation.findForEntities(
      conn,
      [entity.id],
      RelationEnums.Type.SuperordinateEntity,
      0
    );

    const classificationEs: IConcept[] = await getEntitiesByIds<IConcept>(
      conn,
      classificationRels.map((c) => c.entityIds[1])
    );

    const soeEs = await getEntitiesByIds<IEntity>(
      conn,
      soeRels.map((s) => s.entityIds[1])
    );
    const propValueEs = await getEntitiesByIds<IEntity>(
      conn,
      Entity.extractIdsFromProps(entity.props, [PropSpecKind.VALUE])
    );

    return entity.getTBasedWarnings(
      [rootTerritory],
      classificationEs,
      soeEs,
      propValueEs,
      settings
    );
  }

  /**
   * Tests if there is SCLM warning and returns it
   * SCLM warning should pop when there is no superclass for this entity
   * (all entities should have SC pointed to some abstract entity)
   * @param conn
   * @returns
   */
  async hasSCLM(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Concept) {
      return null;
    }

    const scls = await Relation.findForEntities(
      conn,
      [this.entityId],
      RelationEnums.Type.Superclass
    );

    const gotSCL = !!scls.find((s) => s.entityIds[0] === this.entityId);
    return gotSCL
      ? null
      : this.newWarning(
        WarningTypeEnums.SCLM,
        IWarningPositionSection.Relations
      );
  }

  /**
   * Tests if there is ISYNC warning and returns it
   * ISYNC warning should pop when concepts in the synonym cloud have inconsistent superclass relations.
   *
   * Warning IS raised when (for synonyms c1 and c2):
   * - c1 has SCL cs1 and c2 has SCL cs2 but cs1 and cs2 are NOT synonyms
   * - c1 has SCL cs1 but c2 has no SCL (asymmetric SCL)
   *
   * Warning is NOT raised when:
   * - c1 has SCL cs1 and c2 has SCL cs2 and cs1 and cs2 are synonyms
   * - Both c1 and c2 have no SCL
   * - Both c1 and c2 have SCL relation to the same entity
   *
   * @param conn
   * @returns
   */
  async hasISYNC(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Concept) {
      return null;
    }

    // Get all synonym relations for this entity
    const synonymRelations = await Relation.findForEntities(
      conn,
      [this.entityId],
      RelationEnums.Type.Synonym
    );

    // Collect all concept IDs in the synonym cloud
    let conceptIds: string[] = [];
    for (const syn of synonymRelations) {
      conceptIds = conceptIds.concat(syn.entityIds);
    }
    conceptIds = Array.from(new Set(conceptIds));

    // If only one concept (no synonyms), no warning needed
    if (conceptIds.length <= 1) {
      return null;
    }

    // Find SCL relations for concepts in the synonym cloud
    const scls = await Superclass.findForEntities(
      conn,
      conceptIds,
      RelationEnums.Type.Superclass,
      0
    );

    // Group SCL targets by concept
    const sclTargetsByConcept: Record<string, string[]> = {};
    for (const conceptId of conceptIds) {
      sclTargetsByConcept[conceptId] = [];
    }
    for (const scl of scls) {
      const conceptId = scl.entityIds[0];
      const superclassId = scl.entityIds[1];
      if (!sclTargetsByConcept[conceptId].includes(superclassId)) {
        sclTargetsByConcept[conceptId].push(superclassId);
      }
    }

    // Separate concepts with and without SCL
    const conceptsWithSCL = conceptIds.filter(
      (id) => sclTargetsByConcept[id].length > 0
    );
    const conceptsWithoutSCL = conceptIds.filter(
      (id) => sclTargetsByConcept[id].length === 0
    );

    // If some have SCL and others don't → WARNING
    if (conceptsWithSCL.length > 0 && conceptsWithoutSCL.length > 0) {
      return this.newWarning(
        WarningTypeEnums.ISYNC,
        IWarningPositionSection.Relations
      );
    }

    // If none have SCL → OK
    if (conceptsWithSCL.length === 0) {
      return null;
    }

    // All have SCL - collect all unique SCL targets
    const allSclTargetsSet: Set<string> = new Set();
    for (const targets of Object.values(sclTargetsByConcept)) {
      for (const target of targets) {
        allSclTargetsSet.add(target);
      }
    }
    const allSclTargets: string[] = Array.from(allSclTargetsSet);

    // If only one unique target → OK (all point to the same superclass)
    if (allSclTargets.length === 1) {
      return null;
    }

    // Check if all SCL targets are synonyms of each other
    const targetSynonymRelations = await Relation.findForEntities(
      conn,
      allSclTargets,
      RelationEnums.Type.Synonym
    );

    // For each pair of SCL targets, verify they're synonyms
    for (let i = 0; i < allSclTargets.length; i++) {
      for (let j = i + 1; j < allSclTargets.length; j++) {
        const target1 = allSclTargets[i];
        const target2 = allSclTargets[j];

        // Check if they're in the same synonym relation
        const areSynonyms = targetSynonymRelations.some(
          (rel) =>
            rel.entityIds.includes(target1) && rel.entityIds.includes(target2)
        );

        if (!areSynonyms) {
          return this.newWarning(
            WarningTypeEnums.ISYNC,
            IWarningPositionSection.Relations
          );
        }
      }
    }

    return null;
  }

  /**
   * Tests if there is ISYNCAEE warning and returns it
   * ISYNCAEE warning should pop when actions in the synonym cloud have inconsistent AEE relations.
   *
   * Warning IS raised when (for synonyms a1 and a2):
   * - a1 has AEE ae1 and a2 has AEE ae2 but ae1 and ae2 are NOT synonyms
   * - a1 has AEE ae1 but a2 has no AEE (asymmetric AEE)
   *
   * Warning is NOT raised when:
   * - a1 has AEE ae1 and a2 has AEE ae2 and ae1 and ae2 are synonyms
   * - Both a1 and a2 have no AEE
   * - Both a1 and a2 have AEE relation to the same entity
   *
   * @param conn
   * @returns
   */
  async hasISYNCAEE(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Action) {
      return null;
    }

    // Get all synonym relations for this entity
    const synonymRelations = await Relation.findForEntities(
      conn,
      [this.entityId],
      RelationEnums.Type.Synonym
    );

    // Collect all action IDs in the synonym cloud
    let actionIds: string[] = [];
    for (const syn of synonymRelations) {
      actionIds = actionIds.concat(syn.entityIds);
    }
    actionIds = Array.from(new Set(actionIds));

    // If only one action (no synonyms), no warning needed
    if (actionIds.length <= 1) {
      return null;
    }

    // Find AEE relations for actions in the synonym cloud (action at index 0)
    const aeeRels = await Relation.findForEntities(
      conn,
      actionIds,
      RelationEnums.Type.ActionEventEquivalent,
      0
    );

    // Group AEE targets by action
    const aeeTargetsByAction: Record<string, string[]> = {};
    for (const actionId of actionIds) {
      aeeTargetsByAction[actionId] = [];
    }
    for (const aee of aeeRels) {
      const actionId = aee.entityIds[0];
      const eventId = aee.entityIds[1];
      if (!aeeTargetsByAction[actionId].includes(eventId)) {
        aeeTargetsByAction[actionId].push(eventId);
      }
    }

    // Separate actions with and without AEE
    const actionsWithAEE = actionIds.filter(
      (id) => aeeTargetsByAction[id].length > 0
    );
    const actionsWithoutAEE = actionIds.filter(
      (id) => aeeTargetsByAction[id].length === 0
    );

    // If some have AEE and others don't → WARNING
    if (actionsWithAEE.length > 0 && actionsWithoutAEE.length > 0) {
      return this.newWarning(
        WarningTypeEnums.ISYNCAEE,
        IWarningPositionSection.Relations
      );
    }

    // If none have AEE → OK
    if (actionsWithAEE.length === 0) {
      return null;
    }

    // All have AEE - collect all unique AEE targets
    const allAeeTargetsSet: Set<string> = new Set();
    for (const targets of Object.values(aeeTargetsByAction)) {
      for (const target of targets) {
        allAeeTargetsSet.add(target);
      }
    }
    const allAeeTargets: string[] = Array.from(allAeeTargetsSet);

    // If only one unique target → OK (all point to the same event)
    if (allAeeTargets.length === 1) {
      return null;
    }

    // Check if all AEE targets are synonyms of each other
    const targetSynonymRelations = await Relation.findForEntities(
      conn,
      allAeeTargets,
      RelationEnums.Type.Synonym
    );

    // For each pair of AEE targets, verify they're synonyms
    for (let i = 0; i < allAeeTargets.length; i++) {
      for (let j = i + 1; j < allAeeTargets.length; j++) {
        const target1 = allAeeTargets[i];
        const target2 = allAeeTargets[j];

        // Check if they're in the same synonym relation
        const areSynonyms = targetSynonymRelations.some(
          (rel) =>
            rel.entityIds.includes(target1) && rel.entityIds.includes(target2)
        );

        if (!areSynonyms) {
          return this.newWarning(
            WarningTypeEnums.ISYNCAEE,
            IWarningPositionSection.Relations
          );
        }
      }
    }

    return null;
  }

  async hasMVAL(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Action) {
      return null;
    }

    const action = await findEntityById<IAction>(conn, this.entityId);
    if (!action) {
      throw new InternalServerError(
        "action not found while checking MVAL warning"
      );
    }

    if (
      !action.data.entities ||
      (action.data.entities.a1 === undefined &&
        action.data.entities.a2 === undefined &&
        action.data.entities.s === undefined)
    ) {
      return this.newWarning(
        WarningTypeEnums.MVAL,
        IWarningPositionSection.Valencies
      );
    }

    return null;
  }

  /**
   * Tests if there is AVAL warning and returns it
   * @param conn
   * @returns
   */
  async hasAVAL(conn: Connection): Promise<IWarning[] | null> {
    if (this.class !== EntityEnums.Class.Action) {
      return null;
    }

    const action = await findEntityById<IAction>(conn, this.entityId);
    if (!action) {
      throw new InternalServerError(
        "action not found while checking MVAL warning"
      );
    }

    const relations = (
      await Relation.findForEntities(conn, [this.entityId])
    ).filter(
      (r) =>
        [
          RelationEnums.Type.SubjectSemantics,
          RelationEnums.Type.Actant1Semantics,
          RelationEnums.Type.Actant2Semantics,
        ].indexOf(r.type) !== -1
    );
    const warnings = [];

    for (const pos of Object.keys(
      action.data.valencies
    ) as (keyof IActionValency)[]) {
      const types = action.data.entities[pos];
      const valency = action.data.valencies[pos];
      const morphosValid = valency && valency.length > 0;
      const relIds = relations
        .filter((r) => {
          if (pos === "s") {
            return r.type === RelationEnums.Type.SubjectSemantics;
          } else if (pos === "a1") {
            return r.type === RelationEnums.Type.Actant1Semantics;
          } else {
            return r.type === RelationEnums.Type.Actant2Semantics;
          }
        })
        .reduce((acc, curr) => {
          acc = acc.concat(curr.entityIds);
          return acc;
        }, [] as string[])
        .filter((id) => id !== this.entityId);

      const semantFilled = relIds.length > 0;
      const onlyEmptyAllowed =
        !types ||
        !types.length ||
        (types.length === 1 && types[0] === EntityEnums.Extension.Empty);
      if (!morphosValid && onlyEmptyAllowed && !relIds.length) {
        continue;
      }

      const entitiesSet =
        relIds.length > 0 &&
        (types || []).length > 0 &&
        types?.find((t) => t !== EntityEnums.Extension.Empty);

      if (morphosValid && semantFilled && entitiesSet) {
        continue;
      }

      const newWarning = this.newWarning(
        WarningTypeEnums.AVAL,
        IWarningPositionSection.Valencies,
        pos
      );
      warnings.push(newWarning);
    }

    return warnings;
  }

  /**
   * Tests if there is MAEE warning and returns it
   * @param conn
   * @returns
   */
  async hasMAEE(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Action) {
      return null;
    }

    // get AEE relation for entityId (entityId has AEE)
    const aee = await Relation.findForEntities(
      conn,
      [this.entityId],
      RelationEnums.Type.ActionEventEquivalent,
      0
    );

    if (!aee || !aee.length) {
      return this.newWarning(
        WarningTypeEnums.MAEE,
        IWarningPositionSection.Relations
      );
    }

    return null;
  }

  /**
   * Tests if there is PSM warning and returns it
   * @param conn
   * @returns
   */
  async hasPSM(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Concept) {
      return null;
    }

    const concept = await findEntityById<IConcept>(conn, this.entityId);

    if (
      !concept ||
      concept.data.pos === EntityEnums.ConceptPartOfSpeech.Empty
    ) {
      return this.newWarning(
        WarningTypeEnums.PSM,
        IWarningPositionSection.Entity
      );
    }

    return null;
  }

  /**
   * Tests if there is LM warning and returns it
   * @param conn
   * @returns
   */
  async hasLM(conn: Connection): Promise<IWarning | null> {
    const entity = await findEntityById(conn, this.entityId);

    if (!entity || entity.language === EntityEnums.Language.Empty) {
      return this.newWarning(
        WarningTypeEnums.LM,
        IWarningPositionSection.Entity
      );
    }

    return null;
  }

  /**
   * Tests if there is VETM warning and returns it
   * @param conn
   * @returns
   */
  async hasVETM(conn: Connection): Promise<IWarning[] | null> {
    if (this.class !== EntityEnums.Class.Action) {
      return null;
    }

    const action = await findEntityById<IAction>(conn, this.entityId);
    if (!action) {
      throw new InternalServerError(
        "action not found while checking VETM warning"
      );
    }

    const warnings: IWarning[] = [];
    const poss: (keyof IActionValency)[] = ["s", "a1", "a2"];

    for (const pos of poss) {
      const posEntities = action.data.entities[pos];

      if (!posEntities || posEntities?.length === 0) {
        const newWarning = this.newWarning(
          WarningTypeEnums.VETM,
          IWarningPositionSection.Valencies,
          pos
        );
        warnings.push(newWarning);
      }
    }

    return warnings;
  }
}
