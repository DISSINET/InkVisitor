import Relation from "@models/relation/relation";
import Superclass from "@models/relation/superclass";
import { findEntityById } from "@service/shorthands";
import { EntityEnums, RelationEnums, WarningTypeEnums } from "@shared/enums";
import { IAction, IWarning } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
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
  newWarning(warningType: WarningTypeEnums, relId?: string): IWarning {
    return {
      type: warningType,
      message: "",
      origin: relId || "",
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

    const maeeWarning = await this.hasMAEE(conn);
    if (maeeWarning) {
      warnings.push(maeeWarning);
    }

    return warnings;
  }

  /**
   * Tests if there is SCLM warning and returns it
   * SCLM warning should pop when the is no superclass for this entity
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

    let gotAbstractSC = false;

    for (const scl of scls) {
      if (scl.entityIds[1] === this.entityId) {
        gotAbstractSC = true;
        break;
      }
    }

    return gotAbstractSC ? null : this.newWarning(WarningTypeEnums.SCLM);
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

    // find SCL relations with checked entities on 1 index
    const scls = await Superclass.findForEntities(
      conn,
      conceptIds,
      RelationEnums.Type.Superclass,
      1
    );

    // all concepts in the cloud should have these base superclasses
    const scBaseIds = Array.from(new Set(scls.map((s) => s.entityIds[0])));

    // generate list of base superclasses grouped by each concept
    const baseIdsPerConcept: Record<string, string[]> = {};
    for (const conceptId of conceptIds) {
      baseIdsPerConcept[conceptId] = [];
    }

    for (const scl of scls) {
      const specClassId = scl.entityIds[1];
      const baseClassId = scl.entityIds[0];
      const index = baseIdsPerConcept[specClassId].indexOf(baseClassId);
      if (index === -1) {
        baseIdsPerConcept[specClassId].push(baseClassId);
      }
    }

    for (const requiredBaseClassId of scBaseIds) {
      for (const baseClassIds of Object.values(baseIdsPerConcept)) {
        if (baseClassIds.indexOf(requiredBaseClassId) === -1) {
          // required base class is not present for this concept
          return this.newWarning(WarningTypeEnums.ISYNC);
        }
      }
    }

    return null;
  }

  /**
   * Tests if there is MVAL warning and returns it
   * @param conn
   * @returns
   */
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
      !action.data.valencies ||
      (action.data.valencies.a1 === undefined &&
        action.data.valencies.a2 === undefined &&
        action.data.valencies.s === undefined)
    ) {
      return this.newWarning(WarningTypeEnums.MVAL);
    }

    return null;
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

    const aee = await Relation.findForEntity(
      conn,
      this.entityId,
      RelationEnums.Type.ActionEventEquivalent
    );

    if (!aee || !aee.length) {
      return this.newWarning(WarningTypeEnums.MAEE);
    }

    return null;
  }
}
