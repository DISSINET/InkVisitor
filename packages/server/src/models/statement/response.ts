import { EntityEnums, StatementEnums, UserEnums } from "@shared/enums";
import {
  IAction,
  IEntity,
  IProp,
  IResponseStatement,
  IStatement,
  ITerritory,
} from "@shared/types";
import { OrderType } from "@shared/types/response-statement";
import {
  IWarning,
  IWarningPosition,
  IWarningPositionSection,
} from "@shared/types/warning";

import { ActionEntity } from "@models/action/action";
import treeCache from "@service/treeCache";
import { WarningTypeEnums } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Entity from "../entity/entity";
import { PositionRules } from "./PositionRules";
import Statement from "./statement";
import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import { ResponseEntityDetail } from "@models/entity/response";
import { getEntityClass } from "@models/factory";

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

    console.log("");
    console.log("!!! VALIDATION !!!", this.id);

    const parentTId = this.data.territory?.territoryId as string;

    const entitiesFull: ResponseEntityDetail[] = [];

    for (const ai in this.data.actants) {
      const actant = this.data.actants[ai];
      const entityData = this.getEntity(actant.entityId);
      const entityModel = getEntityClass({ ...entityData });
      const entity = new ResponseEntityDetail(entityModel);
      await entity.prepare(req);

      entitiesFull.push(entity);
    }

    if (parentTId) {
      const lineageTIds = [parentTId, ...treeCache.tree.idMap[parentTId].path];

      lineageTIds.forEach((tId) => {
        const tEntity = this.getEntity(tId) as ITerritory;
        const tValidations = tEntity.data.validations;

        tValidations?.forEach((tValidation) => {
          const {
            detail,
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

          entitiesFull
            .filter((entity) => {
              // falls under entity Classes
              if (!entityClasses || !entityClasses.length) {
                // no entity class condition
                return true;
              }

              return entityClasses.includes(entity.class);
            })
            .filter((entity) => {
              // falls under classification condition
              if (!classifications || !classifications.length) {
                // there is no classification condition
                return true;
              }
              const claEntities = entity.relations.CLA?.connections?.map(
                (c) => entity.entities[c.entityIds[1]]
              );

              // at least one required classifications is fullfilled
              return classifications.some((classCondition) =>
                claEntities?.map((c) => c.id).includes(classCondition)
              );
            })
            .forEach((entity) => {
              // CLASSIFICATION TIE
              console.log("to be validated", entity.label);
              if (tieType === EProtocolTieType.Classification) {
                if (!allowedEntities || !allowedEntities.length) {
                  // no condition set, so we need at least one classification
                  if (!entity.relations.CLA?.connections?.length) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEC);
                  }
                } else {
                  // classifications of the entity
                  const claEntities = entity.relations.CLA?.connections?.map(
                    (c) => entity.entities[c.entityIds[1]]
                  );
                  if (
                    !allowedEntities.some((classCondition) =>
                      claEntities?.map((c) => c.id).includes(classCondition)
                    )
                  ) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVECE);
                  }
                }
              }

              // REFERENCE TIE
              else if (tieType === EProtocolTieType.Reference) {
                const eReferences = entity.references;
                // at least one reference (any) needs to be assigned to the E
                if (!allowedEntities || !allowedEntities.length) {
                  if (eReferences.length === 0) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVER);
                  } else {
                    // at least one reference needs to be of the allowed entity
                    if (
                      !eReferences.some((r) =>
                        allowedEntities?.includes(r.resource)
                      )
                    ) {
                      addNewValidationWarning(
                        entity.id,
                        WarningTypeEnums.TVERE
                      );
                    }
                  }
                }
              }
              // PROPERTY TIE
              else if (tieType === EProtocolTieType.Property) {
                // at least one property needs to be assigned to the E
                if (
                  (!allowedClasses || !allowedClasses.length) &&
                  (!allowedEntities || !allowedEntities.length) &&
                  (!propType || !propType.length)
                ) {
                  if (entity.props.length === 0) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEP);
                  }
                }

                // type is defined but value is empty
                else if (
                  propType?.length &&
                  !allowedEntities?.length &&
                  !allowedClasses?.length
                ) {
                  if (
                    !entity.props.some((p) =>
                      propType?.includes(p.type.entityId)
                    )
                  ) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPT);
                  }
                }

                // type is defined, and value classes are defined
                else if (propType?.length && allowedClasses?.length) {
                  if (
                    !entity.props.some((p) => {
                      const propTypeEntityId = p.type.entityId;

                      const propTypeEntity = this.getEntity(propTypeEntityId);
                      const propTypeEntityClass = propTypeEntity.class;
                      return (
                        propType?.includes(p.type.entityId) &&
                        allowedClasses.includes(propTypeEntityClass)
                      );
                    })
                  ) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                  }
                }
                // type is defined, and value entities are defined
                else if (propType?.length && allowedEntities?.length) {
                  if (
                    !entity.props.some(
                      (p) =>
                        propType?.includes(p.type.entityId) &&
                        allowedEntities.includes(p.value.entityId)
                    )
                  ) {
                    addNewValidationWarning(entity.id, WarningTypeEnums.TVEPV);
                  }
                }
              }
            });
        });
      });
    }

    console.log("warnings", warnings);
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
