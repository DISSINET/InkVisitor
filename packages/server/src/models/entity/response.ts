import { Request } from "express";
import { UsedInPosition, UserRoleMode } from "@shared/enums";
import {
  IEntity,
  IProp,
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

export class ResponseEntity extends Entity implements IResponseEntity {
  @nonenumerable
  originalEntity: Entity;

  right: UserRoleMode = UserRoleMode.Read;

  constructor(entity: Entity) {
    super({});
    for (const key of Object.keys(entity)) {
      (this as any)[key] = (entity as any)[key];
    }
    this.originalEntity = entity;
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(request: Request) {
    this.right = this.originalEntity.getUserRoleMode(request.getUserOrFail());
  }
}

export class ResponseEntityDetail
  extends ResponseEntity
  implements IResponseDetail
{
  entities: { [key: string]: IEntity };
  usedInStatement: IResponseUsedInStatement<UsedInPosition>[];
  usedInStatementProps: IResponseUsedInStatement<UsedInPosition>[];
  usedInMetaProps: IResponseUsedInMetaProp<UsedInPosition>[];
  usedAsTemplate?: string[] | undefined;

  // map of entity ids that should be populated in subsequent methods and used in fetching
  // real entities in populateEntitiesMap method
  @nonenumerable
  postponedEntities: Record<string, undefined> = {};

  constructor(entity: Entity) {
    super(entity);
    this.entities = {};
    this.usedInStatement = [];
    this.usedInStatementProps = [];
    this.usedInMetaProps = [];

    for (const key of this.originalEntity.getEntitiesIds()) {
      this.postponedEntities[key] = undefined;
    }
  }

  /**
   * Loads additional fields to satisfy the IResponseDetail interface
   * @param req
   */
  async prepare(req: Request): Promise<void> {
    super.prepare(req);

    // find entities in which at least one props reference equals this.id
    const usedInEntityProps = await Entity.findUsedInProps(
      req.db.connection,
      this.id
    );

    for (const entity of usedInEntityProps) {
      this.walkEntityProps(entity, entity.props);
    }

    this.walkStatementsDataEntities(
      await Statement.findUsedInDataEntities(req.db.connection, this.id)
    );

    this.walkStatementsDataProps(
      await Statement.findUsedInDataProps(req.db.connection, this.id)
    );

    await this.populateEntitiesMap(req.db.connection);

    await this.processTemplateData(req.db.connection);
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
   * gathered ids from previous calls should be used to populate entities map
   * @param conn
   */
  async populateEntitiesMap(conn: Connection): Promise<void> {
    const additionalEntities = await Entity.findEntitiesByIds(
      conn,
      Object.keys(this.postponedEntities)
    );
    for (const entity of additionalEntities) {
      this.entities[entity.id] = entity;
    }
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
      if (prop.type.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Type, prop);
        this.postponedEntities[prop.value.id] = undefined;
        actantValid = true;
      }

      if (prop.value.id === this.id) {
        this.addUsedInMetaProp(actant, UsedInPosition.Value, prop);
        this.postponedEntities[prop.type.id] = undefined;
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
   * @param entity
   * @param position
   */
  addUsedInMetaProp(entity: IEntity, position: UsedInPosition, prop: IProp) {
    this.usedInMetaProps.push({
      entityId: entity.id,
      position,
      prop,
    });
  }

  /**
   * Walks through data-entities arrays to gather required entries for addUsedInStatement method.
   * @param statements
   */
  walkStatementsDataEntities(statements: IStatement[]) {
    for (const statement of statements) {
      for (const action of statement.data.actions) {
        if (action.action === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Action);
        }
      }

      for (const actant of statement.data.actants) {
        if (actant.actant === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Actant);
        }
      }

      for (const tag of statement.data.tags) {
        if (tag === this.id) {
          this.addUsedInStatement(statement, UsedInPosition.Tag);
        }
      }
    }
  }

  /**
   * Adds statement to usedInStatement & entities fields
   * @param statement
   * @param position
   */
  addUsedInStatement(statement: IStatement, position: UsedInPosition) {
    this.usedInStatement.push({
      statement,
      position,
    });

    this.entities[statement.id] = statement;
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
          action.id,
          action.props
        );
      }

      for (const actant of statement.data.actants) {
        this.walkStatementDataRecursiveProps(
          statement,
          actant.id,
          actant.props
        );
      }
    }
  }

  /**
   * Adds statement to usedInStatement & entities fields
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
      if (prop.type.id === this.id) {
        this.addUsedInStatementProp(statement, UsedInPosition.Type, originId);
      }

      if (prop.value.id === this.id) {
        this.addUsedInStatementProp(statement, UsedInPosition.Value, originId);
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
   * @param statement
   * @param position
   * @param originId
   */
  addUsedInStatementProp(
    statement: IStatement,
    position: UsedInPosition,
    originId: string
  ) {
    this.usedInStatementProps.push({
      statement,
      position,
      originId,
    });

    this.entities[statement.id] = statement;
  }
}
