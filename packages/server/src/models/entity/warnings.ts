import Relation from "@models/relation/relation";
import Superclass from "@models/relation/superclass";
import { EntityEnums, RelationEnums, WarningTypeEnums } from "@shared/enums";
import { IWarning } from "@shared/types";
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

    let entityIds: string[] = [];
    for (const syn of synonym) {
      entityIds = entityIds.concat(syn.entityIds);
    }
    entityIds = Array.from(new Set(entityIds));

    // find SCL relations with checked entities on 0 index
    const scls = await Superclass.findForEntities(
      conn,
      entityIds,
      RelationEnums.Type.Superclass,
      0
    );

    let warn: IWarning | null = null;
    const sclTargets = Array.from(new Set(scls.map((s) => s.entityIds[1])));
    if (sclTargets.length === 1 && scls.length > 1) {
      warn = this.newWarning(WarningTypeEnums.ISYNC);
    }

    return warn;
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

    const synonym = await Relation.findForEntity(
      conn,
      this.entityId,
      RelationEnums.Type.Synonym
    );

    let entityIds: string[] = [];
    for (const syn of synonym) {
      entityIds = entityIds.concat(syn.entityIds);
    }
    entityIds = Array.from(new Set(entityIds));

    // find SCL relations with checked entities on 0 index
    const scls = await Superclass.findForEntities(
      conn,
      entityIds,
      RelationEnums.Type.Superclass,
      0
    );

    let warn: IWarning | null = null;
    const sclTargets = Array.from(new Set(scls.map((s) => s.entityIds[1])));
    if (sclTargets.length === 1 && scls.length > 1) {
      warn = this.newWarning(WarningTypeEnums.ISYNC);
    }

    return warn;
  }
}
