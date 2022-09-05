import { EntityEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  Relation as RelationTypes,
  IResponseDetail,
  IResponseEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
  IStatement,
} from "@shared/types";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { nonenumerable } from "@common/decorators";
import { Connection } from "rethinkdb-ts";
import {
  IResponseUsedInStatementClassification,
  IResponseUsedInStatementIdentification,
  IResponseUsedInStatementProps,
} from "@shared/types/response-detail";
import { IRequest } from "src/custom_typings/request";
import { IStatementClassification, IStatementIdentification } from "@shared/types/statement";
import Relation from "@models/relation/relation";

export class ResponseEntity extends Entity implements IResponseEntity {
  @nonenumerable
  originalEntity: Entity;

  // map of entity ids that should be populated in subsequent methods and used in fetching
  // real entities in populateEntitiesMap method
  // used in derived classes
  @nonenumerable
  linkedEntitiesIds: Record<string, undefined> = {};

  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: Entity) {
    super(JSON.parse(JSON.stringify(entity)));

    // entity is base class, we need correct implementation to use overridden methods
    this.originalEntity = entity;
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param request
   */
  async prepare(request: IRequest) {
    this.right = this.originalEntity.getUserRoleMode(request.getUserOrFail());
  }

  /**
 * gathered ids from previous calls should be used to populate entities map
 * @param conn
 */
  async populateEntitiesMap(conn: Connection): Promise<Record<string, IEntity>> {
    const entities: Record<string, IEntity> = {};

    const additionalEntities = await Entity.findEntitiesByIds(
      conn,
      Object.keys(this.linkedEntitiesIds)
    );
    for (const entity of additionalEntities) {
      entities[entity.id] = entity;
    }

    return entities;
  }

  /**
   * populated linked entities map with either single id or list of ids
   * @param idOrIds 
   */
  addLinkedEntities(idOrIds: undefined | string | string[]) {
    if (!idOrIds) {
      return
    }

    if (typeof idOrIds === "object") {
      for (const id of idOrIds) {
        this.addLinkedEntities(id)
      }
    } else {
      this.linkedEntitiesIds[idOrIds] = undefined;
    }
  }
}

export class ResponseEntityDetail
  extends ResponseEntity
  implements IResponseDetail {
  entities: Record<string, IEntity>;
  usedInStatements: IResponseUsedInStatement<EntityEnums.UsedInPosition>[];
  usedInStatementProps: IResponseUsedInStatementProps[];
  usedInMetaProps: IResponseUsedInMetaProp<EntityEnums.UsedInPosition>[];
  usedAsTemplate?: string[] | undefined;
  usedInStatementIdentifications: IResponseUsedInStatementIdentification[];
  usedInStatementClassifications: IResponseUsedInStatementClassification[];

  relations: RelationTypes.IModel[] = [];

  constructor(entity: Entity) {
    super(entity);
    this.entities = {};
    this.usedInStatements = [];
    this.usedInStatementProps = [];
    this.usedInMetaProps = [];
    this.usedInStatementClassifications = [];
    this.usedInStatementIdentifications = [];

    this.addLinkedEntities(this.originalEntity.getEntitiesIds());
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(req: IRequest): Promise<void> {
    super.prepare(req);

    const conn = req.db.connection

    // find entities in which at least one props reference equals this.id
    for (const entity of await Entity.findUsedInProps(conn, this.id)) {
      this.walkEntityProps(entity, entity.props);
    }

    this.walkStatementsDataEntities(
      await Statement.findByDataEntityId(conn, this.id)
    );

    this.walkStatementsDataProps(
      await Statement.findByDataPropsId(conn, this.id)
    );

    this.addLinkedEntities(this.usedAsTemplate)

    await this.populateInStatementsRelations(
      await Statement.findByDataActantsCI(conn, this.id)
    );

    this.relations = await Relation.getForEntity<RelationTypes.IModel>(conn, this.id);

    this.entities = await this.populateEntitiesMap(conn);

    await this.processTemplateData(conn);
  }

  /**
   * Loads entries for usedInStatementIdentifications and usedInStatementClassifications fields
   * Needs to be called after walkStatementsDataEntities, since it uses also populated 
   * entries in usedInStatements field
   * @param statements 
   */
  async populateInStatementsRelations(statements: IStatement[]): Promise<void> {
    for (const statement of statements) {
      for (const actant of statement.data.actants) {
        if (actant.classifications) {
          for (const classData of actant.classifications) {
            if (classData.entityId === this.id) {
              this.addToClassifications(statement.id, actant.entityId, this.id, classData)
              this.addLinkedEntities(statement.id);
            }
          }
        }

        if (actant.identifications) {
          for (const identification of actant.identifications) {
            if (identification.entityId === this.id) {
              this.addToIdentifications(statement.id, actant.entityId, this.id, identification)
              this.addLinkedEntities(statement.id);
            }
          }
        }
      }
    }

    this.usedInStatements
      .filter(us => us.position === EntityEnums.UsedInPosition.Actant)
      .forEach(us => {
        us.statement.data.actants.filter(a => a.entityId === this.id).forEach(a => {
          if (a.classifications) {
            a.classifications.forEach(c => this.addToClassifications(us.statement.id, this.id, this.id, c))
          }
          if (a.identifications) {
            a.identifications?.forEach(i => this.addToIdentifications(us.statement.id, this.id, this.id, i))
          }
        })
      })
  }

  /**
   * Shorthand function for adding IResponseUsedInStatementClassification entries
   * @param sID 
   * @param actantEID 
   * @param relationEID 
   * @param data 
   */
  addToClassifications(sID: string, actantEID: string, relationEID: string, data: IStatementClassification) {
    this.usedInStatementClassifications.push({
      statementId: sID,
      actantEntityId: actantEID,
      relationEntityId: relationEID,
      data,
    });
  }

  /**
   * Shorthand function for adding usedInStatementIdentification entries
   * @param sID 
   * @param actantEID 
   * @param relationEID 
   * @param data 
   */
  addToIdentifications(sID: string, actantEID: string, relationEID: string, data: IStatementIdentification) {
    this.usedInStatementIdentifications.push({
      statementId: sID,
      actantEntityId: actantEID,
      relationEntityId: relationEID,
      data,
    });
  }

  /**
   * loads casts for this entity (template) and fills usedAsTemplate array & entities map with retrieved data
   * @param conn
   */
  async processTemplateData(conn: Connection): Promise<void> {
    const casts = await this.findFromTemplate(conn);
    this.usedAsTemplate = casts.map((c) => c.id);

    casts.forEach((c) => (this.entities[c.id] = c));
  }

  /**
   * Walks through props array recursively to gather required entries for addUsedInMetaProp method.
   * @param actant
   * @param props
   */
  walkEntityProps(actant: IEntity, props: IProp[]) {
    // if actant is linked to this detail entity - should be pushed to entities map
    let actantValid = false;

    for (const prop of props) {
      if (prop.type.entityId === this.id || prop.value.entityId === this.id) {
        this.addUsedInMetaProp(
          actant.id,
          prop.value.entityId,
          prop.type.entityId
        );
        actantValid = true;
      }

      if (prop.children.length) {
        this.walkEntityProps(actant, prop.children);
      }
    }

    if (actantValid) {
      this.entities[actant.id] = actant;
    }
  }

  /**
   * add entry to usedInMetaProps
   * @param originId
   * @param valueId
   * @param typeId
   */
  addUsedInMetaProp(originId: string, valueId: string, typeId: string) {
    this.usedInMetaProps.push({
      originId,
      valueId,
      typeId,
    });
    this.addLinkedEntities([originId, valueId, typeId]);
  }

  /**
   * Walks through data-entities arrays to gather required entries for addUsedInStatement method.
   * @param statements
   */
  walkStatementsDataEntities(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        if (action.actionId === this.id) {
          this.addUsedInStatement(statement, EntityEnums.UsedInPosition.Action);
        }
      }

      for (const actant of statement.data.actants) {
        if (actant.entityId === this.id) {
          this.addUsedInStatement(statement, EntityEnums.UsedInPosition.Actant);
        }
      }

      for (const tag of statement.data.tags) {
        if (tag === this.id) {
          this.addUsedInStatement(statement, EntityEnums.UsedInPosition.Tag);
        }
      }
    }
  }

  /**
   * Adds statement to usedInStatements & entities fields
   * @param statement
   * @param position
   */
  addUsedInStatement(statement: IStatement, position: EntityEnums.UsedInPosition) {
    this.usedInStatements.push({
      statement,
      position,
    });

    this.entities[statement.id] = statement;
    this.addLinkedEntities(statement.data.actants.map(a => a.entityId))
    this.addLinkedEntities(statement.data.actions.map(a => a.actionId))
  }

  /**
   * Walks through statements data-entities and call walkStatementDataRecursiveProps method accordingly.
   * @param statements
   */
  walkStatementsDataProps(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        this.walkStatementDataRecursiveProps(
          statement,
          action.actionId,
          action.props
        );
      }

      for (const actant of statement.data.actants) {
        this.walkStatementDataRecursiveProps(
          statement,
          actant.entityId,
          actant.props
        );
      }
    }
  }

  /**
   * Adds statement to usedInStatements & entities fields
   * @param statement
   * @param originId
   * @param props
   */
  walkStatementDataRecursiveProps(
    statement: IStatement,
    originId: string,
    props: IProp[]
  ) {
    for (const prop of props) {
      if (prop.type.entityId === this.id || prop.value.entityId === this.id) {
        this.addUsedInStatementProp(
          statement.id,
          originId,
          prop.type.entityId,
          prop.value.entityId
        );
      }

      if (prop.children.length) {
        this.walkStatementDataRecursiveProps(
          statement,
          originId,
          prop.children
        );
      }
    }
  }

  /**
   * add entry to usedInStatementProps and entities fields
   * @param statementId
   * @param originId
   * @param valueId
   * @param typeId
   */
  addUsedInStatementProp(
    statementId: string,
    originId: string,
    typeId: string,
    valueId: string
  ) {
    this.usedInStatementProps.push({
      statementId,
      originId,
      typeId,
      valueId,
    });

    this.addLinkedEntities([statementId, originId, valueId, typeId])
  }
}
