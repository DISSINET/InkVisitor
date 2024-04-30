import { EntityEnums, StatementEnums, UserEnums } from "@shared/enums";
import {
  IAction,
  IEntity,
  IProp,
  IResponseStatement,
  IStatement,
  ITerritory,
  Relation,
} from "@shared/types";
import { OrderType } from "@shared/types/response-statement";
import {
  IWarning,
  IWarningPosition,
  IWarningPositionSection,
} from "@shared/types/warning";

import { ActionEntity } from "@models/action/action";
import { ResponseEntity, ResponseEntityDetail } from "@models/entity/response";
import { getEntityClass } from "@models/factory";
import { findEntityById } from "@service/shorthands";
import treeCache from "@service/treeCache";
import { WarningTypeEnums } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Entity from "../entity/entity";
import { PositionRules } from "./PositionRules";
import Statement from "./statement";
import Classification from "@models/relation/classification";

export class ResponseStatement extends Statement implements IResponseStatement {
  entities: { [key: string]: IEntity };
  elementsOrders: OrderType[];
  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;
  warnings: IWarning[];

  constructor(entity: IStatement) {
    super(entity);
    this.entities = {};
    this.elementsOrders = [];
    this.warnings = [];
  }

  async prepare(req: IRequest) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    await this.prepareEntities(req.db.connection);
    this.elementsOrders = this.prepareElementsOrders();
    this.warnings = await this.getWarnings(req);
  }

  async prepareWithoutWarnings(req: IRequest) {
    this.right = this.getUserRoleMode(req.getUserOrFail());
    await this.prepareEntities(req.db.connection);
    this.elementsOrders = this.prepareElementsOrders();
    this.warnings = [];
  }

  /**
   * Prepares the entities map
   * @param db
   */
  async prepareEntities(db: Connection): Promise<void> {
    const entities = await this.getEntities(db);
    this.entities = Object.assign({}, ...entities.map((x) => ({ [x.id]: x })));
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
  async getTValidationWarnings(req: IRequest): Promise<IWarning[]> {
    let warnings: IWarning[] = [];

    // console.log("");
    // console.log("!!! VALIDATION !!!", this.id);

    const parentTId = this.data.territory?.territoryId as string;

    const checkItems: {
      entity: Entity;
      classifications: Relation.IConnection<
        Relation.IClassification,
        Relation.ISuperclass
      >[];
    }[] = [];

    const allEntities = [
      ...this.data.actants.map((a) => a.entityId),
      ...this.data.actions.map((a) => a.actionId),
      this.id, // statement itself
    ];

    this.data.actants.forEach((a) => {
      allEntities.push(...a.classifications.map((c) => c.entityId));
      allEntities.push(...a.identifications.map((c) => c.entityId));
      allEntities.push(...a.props.map((c) => c.type.entityId));
      allEntities.push(...a.props.map((c) => c.value.entityId));
    });
    this.data.actions.forEach((a) => {
      allEntities.push(...a.props.map((c) => c.type.entityId));
      allEntities.push(...a.props.map((c) => c.value.entityId));
    });

    // prepare entities
    for (const ai in allEntities) {
      const entityId = allEntities[ai];

      if (entityId) {
        const entityData = await this.obtainEntity(entityId, req);
        const entityModel = getEntityClass({ ...entityData });
        const entity = new Entity(entityModel);

        const classifications =
          await Classification.getClassificationForwardConnections(
            req.db.connection,
            entityId,
            entity.class,
            1,
            0
          );
        checkItems.push({
          entity,
          classifications: classifications,
        });
      }
    }

    if (parentTId) {
      const lineageTIds = [parentTId, ...treeCache.tree.idMap[parentTId].path];

      for (const tId of lineageTIds) {
        const tEntity = (await this.obtainEntity(tId, req)) as ITerritory;
        const tValidations = tEntity.data.validations;

        for (const tValidation of tValidations ?? []) {
          const {
            entityClasses,
            classifications,
            tieType,
            propType,
            allowedClasses,
            allowedEntities,
          } = tValidation;

          const addNewValidationWarning = (
            entityId: string,
            code: WarningTypeEnums
          ) => {
            warnings.push(
              this.newStatementWarning(
                code,
                {
                  section: IWarningPositionSection.Statement,
                  subSection: `statement`,
                  entityId: entityId,
                },
                tValidation
              )
            );
          };

          const entitiesToCheck = checkItems
            .filter((check) => {
              return entityClasses?.includes(check.entity.class);
            })
            .filter((check) => {
              // falls under classification condition
              if (!classifications || !classifications.length) {
                // there is no classification condition
                return true;
              }
              const claEntities = check.classifications
                ?.map((c) => c.entityIds[1])
                .filter((c) => c);

              // at least one required classifications is fullfilled
              return classifications.some((classCondition) =>
                claEntities?.includes(classCondition)
              );
            });

          for (const ei in entitiesToCheck) {
            const { entity, classifications: eClassifications } =
              entitiesToCheck[ei];
            // CLASSIFICATION TIE
            if (tieType === EProtocolTieType.Classification) {
              if (!allowedEntities || !allowedEntities.length) {
                // no condition set, so we need at least one classification
                if (!eClassifications.length) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVEC);
                }
              } else {
                // classifications of the entity
                const claEntities = eClassifications
                  ?.map((c) => c.entityIds[1])
                  .filter((c) => c);
                if (
                  !allowedEntities.some((classCondition) =>
                    claEntities?.includes(classCondition)
                  )
                ) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVECE);
                }
              }
            }

            // REFERENCE TIE
            else if (tieType === EProtocolTieType.Reference) {
              const eReferences = entity.references.filter(
                (r) => r.resource && r.value
              );
              // at least one reference (any) needs to be assigned to the E
              if (!allowedEntities || !allowedEntities.length) {
                if (eReferences.length === 0) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVER);
                }
              } else {
                // at least one reference needs to be of the allowed entity
                if (
                  !eReferences.some((r) =>
                    allowedEntities?.includes(r.resource)
                  )
                ) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVERE);
                }
              }
            }

            // PROPERTY TIE
            else if (tieType === EProtocolTieType.Property) {
              const eProps = entity.props.filter(
                (p) => p.value.entityId && p.type.entityId
              );

              // at least one property needs to be assigned to the E
              if (
                !propType ||
                (!propType.length &&
                  !allowedEntities?.length &&
                  !allowedClasses?.length)
              ) {
                if (eProps.length === 0) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVEP);
                }

                // type is defined but value is empty
              } else if (
                propType?.length &&
                !allowedEntities?.length &&
                !allowedClasses?.length
              ) {
                if (
                  eProps.length === 0 ||
                  !eProps.some((p) => propType?.includes(p.type.entityId))
                ) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVEPT);
                }
              } else if (allowedEntities?.length || allowedClasses?.length) {
                const validProps = eProps.filter((p) =>
                  propType?.length ? propType.includes(p.type.entityId) : true
                );
                if (!validProps?.length) {
                  addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                } else if (allowedClasses?.length) {
                  // class is required

                  // no valid props
                  if (validProps.length === 0) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                  } else {
                    let passed = true;
                    for (const pi in eProps) {
                      const p = eProps[pi];
                      const propValueEntityId = p.value.entityId;
                      const propValueEntity = await findEntityById(
                        req.db,
                        propValueEntityId
                      );
                      if (
                        propType?.includes(p.type.entityId) &&
                        !allowedClasses?.includes(propValueEntity.class)
                      ) {
                        passed = false;
                      }
                    }
                    if (!passed) {
                      addNewValidationWarning(
                        entity.id,
                        WarningTypeEnums.TVEPV
                      );
                    }
                  }
                } else if (allowedEntities?.length) {
                  // entity is required
                  if (validProps.length === 0) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                  } else if (
                    !validProps.some((p) =>
                      allowedEntities.includes(p.value.entityId)
                    )
                  ) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                  }
                }
              }
            }
          }
        }
      }
    }

    // console.log(warnings);
    return warnings;
  }

  /**
   * checks actions -> actants relations for single position and generates appropriate IWarning entries
   * @param position
   * @returns list of warnings
   */
  getWarningsForPosition(position: EntityEnums.Position): IWarning[] {
    const warnings: IWarning[] = [];

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
      warnings.push(
        this.newStatementWarning(WarningTypeEnums.WAC, {
          section: IWarningPositionSection.Statement,
          subSection: `${position}`,
        })
      );
    }

    if (!rules.mismatch && !actants.length) {
      if (!rules.allowsEmpty() && !rules.allUndefined) {
        warnings.push(
          this.newStatementWarning(WarningTypeEnums.MA, {
            section: IWarningPositionSection.Statement,
            subSection: `${position}`,
          })
        );
      } else if (rules.allUndefined) {
        return warnings;
      }
    }

    rules.undefinedActions.forEach((actionId) => {
      warnings.push(
        this.newStatementWarning(WarningTypeEnums.AVU, {
          section: IWarningPositionSection.Statement,
          subSection: position,
          entityId: actionId,
        })
      );
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
          warnings.push(
            this.newStatementWarning(WarningTypeEnums.ANA, {
              section: IWarningPositionSection.Statement,
              subSection: `${position}`,
              actantId: stActant.id,
              entityId: stActant.entityId,
            })
          );
        } else if (!actionRules.includes(actant.class)) {
          warnings.push(
            this.newStatementWarning(WarningTypeEnums.WA, {
              section: IWarningPositionSection.Statement,
              subSection: `${position}`,
              actantId: stActant.id,
              entityId: stActant.entityId,
            })
          );
        }
      }
    }

    return warnings;
  }

  /**
   * get a list of all warnings for actions -> actants relations
   * @returns list of warnings
   */
  async getWarnings(req: IRequest): Promise<IWarning[]> {
    let warnings: IWarning[] = [];

    const tbasedWarnings = await this.getTValidationWarnings(req);
    warnings = warnings.concat(tbasedWarnings);

    if (!this.data.actions.length) {
      warnings.push(this.newStatementWarning(WarningTypeEnums.NA, {}));
      return warnings;
    }

    for (const position of [
      EntityEnums.Position.Actant1,
      EntityEnums.Position.Actant2,
      EntityEnums.Position.Subject,
    ]) {
      warnings = warnings.concat(this.getWarningsForPosition(position));
    }

    return warnings;
  }

  /**
   * fills values for elementsOrders array + sort them afterwards
   */
  prepareElementsOrders(): OrderType[] {
    /// unsorted items here
    const temp: OrderType[] = [];

    // statement.props
    Entity.extractIdsFromProps(this.props, (prop: IProp) => {
      temp.push({
        type: StatementEnums.ElementType.Prop,
        propValueId: prop.value.entityId,
        propTypeId: prop.type.entityId,
        originId: this.id,
        elementId: prop.id,
        order: prop.statementOrder !== undefined ? prop.statementOrder : false,
      });
    });

    // statement.actions
    for (const action of this.data.actions) {
      temp.push({
        type: StatementEnums.ElementType.Action,
        entityId: action.actionId,
        elementId: action.id,
        order: action.statementOrder,
      });

      // statement.actions.props
      Entity.extractIdsFromProps(action.props, (prop: IProp) => {
        temp.push({
          type: StatementEnums.ElementType.Prop,
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: action.actionId,
          elementId: prop.id,
          order:
            prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });
    }

    // statement.actants
    for (const actant of this.data.actants) {
      temp.push({
        type: StatementEnums.ElementType.Actant,
        entityId: actant.entityId,
        elementId: actant.id,
        order: actant.statementOrder,
      });

      // statement.actants.props
      Entity.extractIdsFromProps(actant.props, (prop: IProp) => {
        temp.push({
          type: StatementEnums.ElementType.Prop,
          propValueId: prop.value.entityId,
          propTypeId: prop.type.entityId,
          originId: actant.entityId,
          elementId: prop.id,
          order:
            prop.statementOrder !== undefined ? prop.statementOrder : false,
        });
      });

      // statement.actants.classifications
      for (const classification of actant.classifications) {
        temp.push({
          type: StatementEnums.ElementType.Classification,
          entityId: classification.entityId,
          originId: actant.entityId,
          elementId: classification.id,
          order: classification.statementOrder,
        });
      }

      // statement.actants.identifications
      for (const identification of actant.identifications) {
        temp.push({
          type: StatementEnums.ElementType.Identification,
          entityId: identification.entityId,
          originId: actant.entityId,
          elementId: identification.id,
          order: identification.statementOrder,
        });
      }
    }

    return ResponseStatement.sortListOfStatementItems(temp);
  }

  /**
   * Sorts the list of sortable elements for elementsOrders field.
   * Empty (false) values would be pushed to the end of the list.
   * @param unsorted
   * @returns
   */
  public static sortListOfStatementItems(unsorted: OrderType[]): OrderType[] {
    return unsorted.sort((a, b) => {
      if (b.order === a.order && a.order === false) {
        return 0;
      }
      if (b.order === false) {
        return -Infinity;
      }
      if (a.order === false) {
        return Infinity;
      }
      return a.order - b.order;
    });
  }
}
function findEntity(propValueEntityId: string) {
  throw new Error("Function not implemented.");
}
