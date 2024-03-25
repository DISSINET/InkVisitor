import Relation from "@models/relation/relation";
import Superclass from "@models/relation/superclass";
import { findEntityById } from "@service/shorthands";
import { EntityEnums, RelationEnums, WarningTypeEnums } from "@shared/enums";
import { IAction, IConcept, IWarning } from "@shared/types";
import { IActionValency } from "@shared/types/action";
import { InternalServerError } from "@shared/types/errors";
import { IWarningPositionSection } from "@shared/types/warning";
import { Connection } from "rethinkdb-ts";

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
    const warnings: IWarning[] = [];

    const sclmWarning = await this.hasSCLM(conn);
    if (sclmWarning) {
      warnings.push(sclmWarning);
    }

    const isyncWarning = await this.hasISYNC(conn);
    if (isyncWarning) {
      warnings.push(isyncWarning);
    }

    const mvalWarning = await this.hasMVAL(conn);
    if (mvalWarning) {
      warnings.push(mvalWarning);
    }

    const avalWarnings = await this.hasAVAL(conn);
    if (avalWarnings) {
      avalWarnings.forEach((w) => warnings.push(w));
    }

    const maeeWarning = await this.hasMAEE(conn);
    if (maeeWarning) {
      warnings.push(maeeWarning);
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

    const scls = await Relation.findForEntity(
      conn,
      this.entityId,
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
   * ISYNC warning should pop when the connected synonym cloud does have some concepts that does not share the same superclass relation
   * (all concepts in the connected cloud should have SC pointed to some abstract entity)
   * @param conn
   * @returns
   */
  async hasISYNC(conn: Connection): Promise<IWarning | null> {
    if (this.class !== EntityEnums.Class.Concept) {
      return null;
    }

    const synonym = await Relation.findForEntity(
      conn,
      this.entityId,
      RelationEnums.Type.Synonym
    );

    let conceptIds: string[] = [];
    for (const syn of synonym) {
      conceptIds = conceptIds.concat(syn.entityIds);
    }
    conceptIds = Array.from(new Set(conceptIds));

    // find SCL relations with checked entities on 0 index
    const scls = await Superclass.findForEntities(
      conn,
      conceptIds,
      RelationEnums.Type.Superclass,
      0
    );

    // all concepts in the cloud should have these base superclasses
    const superIds = Array.from(new Set(scls.map((s) => s.entityIds[1])));

    // generate list of base superclasses grouped by each concept
    const baseIdsPerConcept: Record<string, string[]> = {};
    for (const conceptId of conceptIds) {
      baseIdsPerConcept[conceptId] = [];
    }

    for (const scl of scls) {
      const specClassId = scl.entityIds[0];
      const superClassId = scl.entityIds[1];
      const index = baseIdsPerConcept[specClassId].indexOf(superClassId);
      if (index === -1) {
        baseIdsPerConcept[specClassId].push(superClassId);
      }
    }

    for (const requiredBaseClassId of superIds) {
      for (const baseClassIds of Object.values(baseIdsPerConcept)) {
        if (baseClassIds.indexOf(requiredBaseClassId) === -1) {
          // required base class is not present for this concept
          return this.newWarning(
            WarningTypeEnums.ISYNC,
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
      await Relation.findForEntity(conn, this.entityId)
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
    const aee = await Relation.findForEntity(
      conn,
      this.entityId,
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
        "action not found while checking MVAL warning"
      );
    }

    const warnings: IWarning[] = [];

    for (const pos of Object.keys(
      action.data.entities
    ) as (keyof IActionValency)[]) {
      if (action.data.entities[pos]?.length === 0) {
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
