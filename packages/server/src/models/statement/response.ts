import { EntityEnums, RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IAction,
  IConcept,
  IEntity,
  IResponseStatement,
  IStatement,
  ITerritory,
} from "@inkvisitor/shared/types";
import {
  IWarning,
  IWarningPosition,
  IWarningPositionSection,
} from "@inkvisitor/shared/types/warning";

import { ActionEntity } from "@models/action/action";
import Relation from "@models/relation/relation";
import Classification from "@models/relation/classification";
import { findEntityById, getEntitiesByIds } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { WarningTypeEnums } from "@inkvisitor/shared/enums";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { PropSpecKind } from "@inkvisitor/shared/types/prop";
import { IResponseUsedInDocument } from "@inkvisitor/shared/types/response-detail";
import { ITerritoryValidation } from "@inkvisitor/shared/types/territory";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Entity from "../entity/entity";
import { PositionRules } from "./PositionRules";
import Statement from "./statement";
import { Setting } from "@models/setting/setting";
import { ISetting } from "@inkvisitor/shared/types/settings";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;
  warnings: IWarning[];
  usedInDocuments: IResponseUsedInDocument[];
  anchorTexts?: string[];

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
    this.warnings = [];
    this.usedInDocuments = [];
  }

  async prepare(req: IRequest, settings?: ISetting[]) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    this.usedInDocuments = await this.findUsedInDocuments(req.db.connection);
    // Display-friendly mirror of the statement's own anchor spans (see
    // IResponseStatement.anchorTexts); derived from the already-loaded documents.
    const anchorTexts = this.usedInDocuments
      .map((d) => d.anchorText)
      .filter((t) => t);
    if (anchorTexts.length) {
      this.anchorTexts = anchorTexts;
    }

    await this.prepareEntities(req.db.connection);
    if (!this.isTemplate) {
      this.warnings = await this.getWarnings(req, settings);
    }
  }

  /**
   * Prepares the statement with preloaded entities
   * Does not generate warnings
   * Does need usedInDocuments to be set
   * @param req
   * @param preloadedEntities
   */
  prepareSync(req: IRequest, preloadedEntities: Record<string, IEntity>) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    this.prepareEntitiesSync(preloadedEntities);
  }

  prepareEntitiesSync(preloadedEntities: Record<string, IEntity>) {
    const wantedEntityIds = this.getEntitiesIds();
    const wantedAnchorEntityIds = Entity.extractIdsFromAnchors(
      this.usedInDocuments
    );
    const entities: IEntity[] = [];
    const anchorEntities: IEntity[] = [];

    for (const entityId of wantedEntityIds) {
      if (preloadedEntities[entityId]) {
        entities.push(preloadedEntities[entityId]);
      }
    }

    for (const anchorEntityId of wantedAnchorEntityIds) {
      if (preloadedEntities[anchorEntityId]) {
        anchorEntities.push(preloadedEntities[anchorEntityId]);
      }
    }

    this.entities = Object.assign(
      {},
      ...entities.map((x) => ({ [x.id]: x })),
      ...anchorEntities.map((x) => ({ [x.id]: x }))
    );
  }
  /**
   * Prepares the entities map
   * @param db
   */
  async prepareEntities(db: Connection): Promise<void> {
    const entities = await this.getEntities(db);
    const anchorEntities = await Entity.findEntitiesByIds(
      db,
      Entity.extractIdsFromAnchors(this.usedInDocuments)
    );

    this.entities = Object.assign(
      {},
      ...entities.map((x) => ({ [x.id]: x })),
      ...anchorEntities.map((x) => ({ [x.id]: x }))
    );

    // stamp document anchor spans onto statement entities so tags can show
    // them as labels (response-only field, see IEntity.anchorTexts)
    await Entity.applyAnchorTexts(db, this.entities);
  }

  /**
   * Returns list of supported entity classes from actions valencies
   * @returns list of classes
   */
  getSubjectETypes(): EntityEnums.ExtendedClass[] {
    return this.data.actions
      .map((a) => a.actionId)
      .filter(
        (aid) =>
          this.entities[aid] &&
          this.entities[aid].class === EntityEnums.Class.Action
      )
      .reduce<EntityEnums.ExtendedClass[]>(
        (acc, aid) =>
          acc.concat((this.entities[aid] as IAction).data.entities.s || []),
        []
      );
  }

  /**
   * Shorthand for creating new statement warning
   * @param warningType
   * @param position
   * @returns new instance of warning
   */
  newStatementWarning(
    warningType: WarningTypeEnums,
    position: IWarningPosition,
    validation?: ITerritoryValidation
  ): IWarning {
    return {
      type: warningType,
      origin: this.id,
      validation,
      position,
    };
  }

  /**
   * Returns single cached entity by id. Throws error in case of not found entity.
   * @param id
   * @returns wanted IEntity
   */
  getEntity(id: string): IEntity {
    const entity = this.entities[id];

    if (!entity) {
      throw new InternalServerError(`Entity ${id} not preloaded`);
    }

    return entity;
  }

  async obtainEntity(entityId: string, req: IRequest): Promise<IEntity> {
    const storedEntity = this.entities[entityId];

    if (storedEntity) {
      return storedEntity;
    }

    const entity = await findEntityById(req.db, entityId);

    this.entities[entityId] = entity;
    return entity;
  }

  /**
   * Check allowed entity classes for subject / actant1 / actant2 position based on action valencies and adds it to warnings field
   * @param warnings
   * @param position
   * @param warningType
   */
  checkValencyClassesForPosition(
    position: EntityEnums.Position,
    warningType: WarningTypeEnums
  ): IWarning[] {
    const warnings: IWarning[] = [];

    let allowedClasses: EntityEnums.ExtendedClass[] = [];

    this.data.actions
      .filter((a) => !!a.actionId)
      .map((a) => a.actionId)
      .forEach((aid) => {
        const actionEntities = (this.getEntity(aid) as IAction).data
          .entities as Record<EntityEnums.Position, EntityEnums.Class[]>;
        allowedClasses = allowedClasses.concat(actionEntities[position]);
      });

    this.data.actants
      .filter((a) => a.position === position)
      .filter((a) => !!a.entityId)
      .forEach((a) => {
        const entity = this.entities[a.entityId];
        if (entity && !allowedClasses.includes(entity.class)) {
          warnings.push(
            this.newStatementWarning(warningType, {
              section: IWarningPositionSection.Statement,
              subSection: `${position}`,
              entityId: a.entityId,
              actantId: a.id,
            })
          );
        }
      });

    return warnings;
  }

  /**
   * check all avalidation warnings for single entity
   */
  async getTValidationWarnings(req: IRequest, preloadedSettings?: ISetting[]): Promise<IWarning[]> {
    let warnings: IWarning[] = [];

    const settings = preloadedSettings ?? await Setting.getSettingsAll(req.db.connection);

    let allEntities = [
      ...this.data.actants.map((a) => a.entityId),
      ...this.data.actions.map((a) => a.actionId),
      this.id, // statement itself
    ];

    this.data.actants.forEach((a) => {
      allEntities.push(...a.classifications.map((c) => c.entityId));
      allEntities.push(...a.identifications.map((c) => c.entityId));

      // todo go deeper
      allEntities.push(...a.props.map((c) => c.type.entityId));
      allEntities.push(...a.props.map((c) => c.value.entityId));
    });
    this.data.actions.forEach((a) => {
      allEntities.push(...a.props.map((c) => c.type.entityId));
      allEntities.push(...a.props.map((c) => c.value.entityId));
    });

    allEntities = [...new Set(allEntities)];

    const parentTId = this.data.territory?.territoryId as string;
    const lineageTIds = [parentTId, ...treeCache.tree.idMap[parentTId].path];
    // The tree cache already holds full Territory entities (including
    // data.validations) and is rebuilt synchronously on every territory write
    // (Territory.save/update/delete -> treeCache.initialize). On a
    // single-instance deployment it is therefore always current, so we can read
    // the lineage territories straight from memory and skip a per-statement DB
    // round-trip. Falls back to the DB if any id is missing from the cache (e.g.
    // NODE_ENV=test, where the cache is not initialized). Only .id and
    // .data.validations are read downstream, both present on the cached
    // Territory instances. Cross-ancestor warning order may differ from the DB
    // path, but getAll(...) never guaranteed an order to begin with.
    const cachedLineage = lineageTIds.map(
      (tid) => treeCache.tree.idMap[tid]?.territory as ITerritory | undefined
    );
    const territoryEs: ITerritory[] = cachedLineage.every((t) => t)
      ? (cachedLineage as ITerritory[])
      : await getEntitiesByIds<ITerritory>(req.db.connection, lineageTIds);

    // The per-entity loop below exists only to evaluate territory validations
    // (getTBasedWarnings) against each referenced entity. If no ancestor
    // territory in the lineage defines an active validation, that evaluation
    // can only return [], so every per-entity relation/entity round-trip is
    // dead work - and it dominates the territory detail endpoint's latency on
    // projects without active validations. Detect it once and skip the
    // expensive lookups. The condition mirrors the active filter inside
    // Entity.getTBasedWarnings (active !== false).
    const hasActiveValidations = territoryEs.some((t) =>
      t.data.validations?.some((v) => v.active !== false)
    );

    // prepare entities
    for (const ei in allEntities) {
      const entityId = allEntities[ei];
      if (entityId) {
        // obtainEntity is kept even when there are no validations: it has the
        // side effect of populating this.entities (notably the statement's own
        // id) which is part of the serialized response. Only the relation /
        // entity fetches that feed getTBasedWarnings are skipped below.
        const entityData = await this.obtainEntity(entityId, req);

        if (entityData?.id === entityId) {
          if (!hasActiveValidations) {
            continue;
          }

          const entity = new Entity(entityData);

          const classificationRels =
            await Classification.getClassificationForwardConnections(
              req.db.connection,
              entityId,
              entity.class,
              1,
              0
            );
          const soeRels = await Relation.findForEntities(
            req.db.connection,
            [entity.id],
            RelationEnums.Type.SuperordinateEntity,
            0
          );

          const classificationEs: IConcept[] = await getEntitiesByIds<IConcept>(
            req.db.connection,
            classificationRels.map((c) => c.entityIds[1])
          );

          const soeEs = await getEntitiesByIds<IEntity>(
            req.db.connection,
            soeRels.map((s) => s.entityIds[1])
          );
          const propValueEs = await getEntitiesByIds<IEntity>(
            req.db.connection,
            Entity.extractIdsFromProps(entity.props, [PropSpecKind.VALUE])
          );
          const eWarnings = entity.getTBasedWarnings(
            territoryEs,
            classificationEs,
            soeEs,
            propValueEs,
            settings
          );
          if (eWarnings.length) {
            warnings = warnings.concat(eWarnings);
          }
        }
      }
    }

    return warnings;
  }

  /**
   * checks actions -> actants relations for single position and generates appropriate IWarning entries
   * @param position
   * @returns list of warnings
   */
  getWarningsForPosition(
    position: EntityEnums.Position,
    settings: ISetting[]
  ): IWarning[] {
    const warnings: IWarning[] = [];

    const isMAEnabled =
      settings.find((s) => s.id === "validation_MA")?.value === true;
    const isWAEnabled =
      settings.find((s) => s.id === "validation_WA")?.value === true;
    const isANAEnabled =
      settings.find((s) => s.id === "validationANAC")?.value === true;
    const isWACEnabled =
      settings.find((s) => s.id === "validation_WAC")?.value === true;
    const isAVUEnabled =
      settings.find((s) => s.id === "validation_AVU")?.value === true;

    // actantId / entityId could be empty, ignore them
    const actions = this.data.actions.filter((a) => !!a.actionId);
    const actants = this.data.actants
      .filter((a) => !!a.entityId)
      .filter((a) => a.position === position);

    const rules = new PositionRules(
      actions.map<IAction>((a) => this.getEntity(a.actionId) as IAction),
      position
    );

    if (rules.mismatch) {
      if (isWACEnabled) {
        warnings.push(
          this.newStatementWarning(WarningTypeEnums.WAC, {
            section: IWarningPositionSection.Statement,
            subSection: `${position}`,
          })
        );
      }
    }

    if (!rules.mismatch && !actants.length) {
      if (!rules.allowsEmpty() && !rules.allUndefined) {
        if (isMAEnabled) {
          warnings.push(
            this.newStatementWarning(WarningTypeEnums.MA, {
              section: IWarningPositionSection.Statement,
              subSection: `${position}`,
            })
          );
        }
      } else if (rules.allUndefined) {
        return warnings;
      }
    }

    rules.undefinedActions.forEach((actionId) => {
      if (isAVUEnabled) {
        warnings.push(
          this.newStatementWarning(WarningTypeEnums.AVU, {
            section: IWarningPositionSection.Statement,
            subSection: position,
            entityId: actionId,
          })
        );
      }
    });

    if (rules.allUndefined || rules.mismatch) {
      return warnings;
    }

    for (const stAction of actions) {
      const action = this.getEntity(stAction.actionId);
      const actionRules = ActionEntity.toRules(action.data.entities)[position];

      // continue with actant specific warning only if common warn is not set
      for (const stActant of actants) {
        const actant = this.getEntity(stActant.entityId);
        const position = stActant.position;

        if (!actionRules) {
          // action rules undefined for this position - only common warning should be returned (AVU)
        } else if (PositionRules.allowsOnlyEmpty(actionRules)) {
          if (isANAEnabled) {
            warnings.push(
              this.newStatementWarning(WarningTypeEnums.ANA, {
                section: IWarningPositionSection.Statement,
                subSection: `${position}`,
                actantId: stActant.id,
                entityId: action.id,
              })
            );
          }
        } else if (!actionRules.includes(actant.class)) {
          if (isWAEnabled) {
            warnings.push(
              this.newStatementWarning(WarningTypeEnums.WA, {
                section: IWarningPositionSection.Statement,
                subSection: `${position}`,
                actantId: stActant.id,
                entityId: action.id,
              })
            );
          }
        }
      }
    }

    return warnings;
  }

  /**
   * get a list of all warnings for actions -> actants relations
   * @returns list of warnings
   */
  async getWarnings(req: IRequest, preloadedSettings?: ISetting[]): Promise<IWarning[]> {
    const settings = preloadedSettings ?? await Setting.getSettingsAll(req.db.connection);

    const isNAEnabled =
      settings.find((s) => s.id === "validation_NA")?.value === true;

    let warnings: IWarning[] = [];

    const tbasedWarnings = await this.getTValidationWarnings(req, settings);
    warnings = warnings.concat(tbasedWarnings);

    if (!this.data.actions.length) {
      if (isNAEnabled) {
        warnings.push(this.newStatementWarning(WarningTypeEnums.NA, {}));
      }
      return warnings;
    }

    for (const position of [
      EntityEnums.Position.Actant1,
      EntityEnums.Position.Actant2,
      EntityEnums.Position.Subject,
    ]) {
      warnings = warnings.concat(
        this.getWarningsForPosition(position, settings)
      );
    }

    return warnings;
  }
}
