import { EntityEnums, RelationEnums, UserEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  Relation as RelationTypes,
  IResponseDetail,
  IResponseEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
  IStatement,
  IWarning,
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
import {
  IStatementClassification,
  IStatementIdentification,
} from "@shared/types/statement";
import { UsedRelations } from "@models/relation/relations";
import EntityWarnings from "./warnings";

export class ResponseEntity extends Entity implements IResponseEntity {
  // map of entity ids that should be populated in subsequent methods and used in fetching
  // real entities in populateEntitiesMap method
  // used in derived classes
  @nonenumerable
  linkedEntitiesIds: Record<string, undefined> = {};

  right: UserEnums.RoleMode = UserEnums.RoleMode.Read;

  constructor(entity: Entity) {
    super({});

    // passed entity here is used as in composition - ResponseEntity is just a wrapper
    // to remove this proxy, add required IEntity fields to ResponseEntity and fill those fields
    return new Proxy(this, {
      ownKeys(target) {
        return [
          ...new Set(Reflect.ownKeys(entity).concat(Object.keys(target))),
        ];
      },
      getOwnPropertyDescriptor(target, prop) {
        return (
          Object.getOwnPropertyDescriptor(entity, prop) ||
          Object.getOwnPropertyDescriptor(target, prop)
        );
      },
      get(target, prop, receiver) {
        return (entity as any)[prop] || ((target as any)[prop as any] as any);
      },
    });
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param request
   */
  prepare(request: IRequest) {
    this.right = this.getUserRoleMode(request.getUserOrFail());
  }

  /**
   * gathered ids from previous calls should be used to populate entities map
   * @param conn
   */
  async populateEntitiesMap(
    conn: Connection
  ): Promise<Record<string, IEntity>> {
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
   * populates linked entities map with either single id or list of ids
   * @param idOrIds
   */
  addLinkedEntities(idOrIds: undefined | string | string[]) {
    if (!idOrIds) {
      return;
    }

    if (typeof idOrIds === "object") {
      for (const id of idOrIds) {
        this.addLinkedEntities(id);
      }
    } else {
      this.linkedEntitiesIds[idOrIds] = undefined;
    }
  }
}

export class ResponseEntityDetail
  extends ResponseEntity
  implements IResponseDetail
{
  entities: Record<string, IEntity>;
  usedInStatements: IResponseUsedInStatement<EntityEnums.UsedInPosition>[];
  usedInStatementProps: IResponseUsedInStatementProps[];
  usedInMetaProps: IResponseUsedInMetaProp[];
  usedAsTemplate: string[];
  usedInStatementIdentifications: IResponseUsedInStatementIdentification[];
  usedInStatementClassifications: IResponseUsedInStatementClassification[];

  relations: UsedRelations;
  warnings: IWarning[];

  constructor(entity: Entity) {
    super(entity);
    this.entities = {};
    this.usedInStatements = [];
    this.usedInStatementProps = [];
    this.usedInMetaProps = [];
    this.usedInStatementClassifications = [];
    this.usedInStatementIdentifications = [];
    this.usedAsTemplate = [];
    this.relations = new UsedRelations(entity.id, entity.class);
    this.warnings = [];

    this.addLinkedEntities(this.getEntitiesIds());
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(req: IRequest): Promise<void> {
    super.prepare(req);

    const conn = req.db.connection;

    // find entities in which at least one props reference equals this.id
    for (const entity of await Entity.findUsedInProps(conn, this.id)) {
      this.walkEntityProps(entity.id, entity.props);
    }

    this.walkStatementsDataEntities(
      await Statement.getLinkedEntities(conn, this.id)
    );

    const statementsByPropsValueType = await Statement.findByDataPropsId(
      conn,
      this.id
    );

    // this was added as a hot fix for #1528, this should be done better
    const statementsByActantActions = await Statement.getLinkedEntities(
      conn,
      this.id
    );
    statementsByActantActions.forEach((s) => {
      s.data.actants
        .filter((a) => a.entityId === this.id)
        .forEach((a) => {
          if (a.props.length !== 0) {
            statementsByPropsValueType.push(s);
          }
        });
    });

    this.walkStatementsDataProps(statementsByPropsValueType);

    await this.populateInStatementsRelations(
      await Statement.findByDataActantsCI(conn, this.id)
    );

    await this.relations.prepare(req, RelationEnums.AllTypes);
    for (const type of RelationEnums.AllTypes) {
      this.addLinkedEntities(this.relations.getEntityIdsFromType(type));
    }

    await this.processTemplateData(conn);

    // finally retrieve all entities by stored id
    this.entities = await this.populateEntitiesMap(conn);

    this.warnings = await new EntityWarnings(this.id, this.class).getWarnings(
      req.db.connection
    );
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
        for (const classData of actant.classifications || []) {
          if (classData.entityId === this.id) {
            this.addToClassifications(
              statement.id,
              actant.entityId,
              this.id,
              classData
            );
          }
        }

        for (const identification of actant.identifications || []) {
          if (identification.entityId === this.id) {
            this.addToIdentifications(
              statement.id,
              actant.entityId,
              this.id,
              identification
            );
          }
        }
      }
    }

    // add Cs/Is, that are in actant object, that has the same ID as this entity
    const usedAsActants = this.usedInStatements.filter(
      (us) => us.position === EntityEnums.UsedInPosition.Actant
    );
    for (const usedAsActant of usedAsActants) {
      const actants = usedAsActant.statement.data.actants.filter(
        (a) => a.entityId === this.id
      );
      for (const actant of actants) {
        actant.classifications?.forEach((c) =>
          this.addToClassifications(
            usedAsActant.statement.id,
            actant.entityId,
            c.entityId,
            c
          )
        );
        actant.identifications?.forEach((i) =>
          this.addToIdentifications(
            usedAsActant.statement.id,
            actant.entityId,
            i.entityId,
            i
          )
        );
      }
    }

    this.usedInStatementClassifications.forEach((c) => {
      this.addLinkedEntities(c.statementId);
      this.addLinkedEntities(c.actantEntityId);
      this.addLinkedEntities(c.relationEntityId);
    });
    this.usedInStatementIdentifications.forEach((c) => {
      this.addLinkedEntities(c.statementId);
      this.addLinkedEntities(c.actantEntityId);
      this.addLinkedEntities(c.relationEntityId);
    });
  }

  /**
   * Shorthand function for adding IResponseUsedInStatementClassification entries
   * @param sID
   * @param actantEID
   * @param relationEID
   * @param data
   */
  addToClassifications(
    sID: string,
    actantEID: string,
    relationEID: string,
    data: IStatementClassification
  ) {
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
  addToIdentifications(
    sID: string,
    actantEID: string,
    relationEID: string,
    data: IStatementIdentification
  ) {
    this.usedInStatementIdentifications.push({
      statementId: sID,
      actantEntityId: actantEID,
      relationEntityId: relationEID,
      data,
    });
  }

  /**
   * loads derived entites for this entity (template) and fills usedAsTemplate array & entities map with retrieved data
   * @param conn
   */
  async processTemplateData(conn: Connection): Promise<void> {
    this.usedAsTemplate = (await this.findDerived(conn)).map((c) => c.id);
    this.addLinkedEntities(this.usedAsTemplate);
  }

  /**
   * Walks through props array recursively to gather required entries for addUsedInMetaProp method.
   * @param actant
   * @param props
   */
  walkEntityProps(originId: string, props: IProp[]) {
    for (const prop of props) {
      if (prop.type.entityId === this.id || prop.value.entityId === this.id) {
        this.addUsedInMetaProp(
          originId,
          prop.value.entityId,
          prop.type.entityId
        );
      }

      if (prop.children.length) {
        this.walkEntityProps(originId, prop.children);
      }
    }
  }

  /**
   * add entry to usedInMetaProps
   * @param originId
   * @param valueId
   * @param typeId
   */
  addUsedInMetaProp(originId: string, valueId: string, typeId: string) {
    if (
      !this.usedInMetaProps.find(
        (u) =>
          u.originId === originId &&
          u.valueId === valueId &&
          u.typeId === typeId
      )
    ) {
      this.usedInMetaProps.push({
        originId,
        valueId,
        typeId,
      });
    }
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
  addUsedInStatement(
    statement: IStatement,
    position: EntityEnums.UsedInPosition
  ) {
    this.usedInStatements.push({
      statement,
      position,
    });

    this.addLinkedEntities(statement.id);
    this.addLinkedEntities(statement.data.actants.map((a) => a.entityId));
    this.addLinkedEntities(statement.data.actions.map((a) => a.actionId));
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
      if (
        prop.type.entityId === this.id ||
        prop.value.entityId === this.id ||
        originId === this.id
      ) {
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

    this.addLinkedEntities([statementId, originId, valueId, typeId]);
  }
}
