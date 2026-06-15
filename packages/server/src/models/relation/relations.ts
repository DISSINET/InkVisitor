import { nonenumerable } from "@common/decorators";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IWarning, Relation as RelationTypes } from "@inkvisitor/shared/types";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Actant1Semantics from "./actant1-semantics";
import Actant2Semantics from "./actant2-semantics";
import ActionEventEquivalent from "./action-event-equivalent";
import Antonym from "./antonym";
import Classification from "./classification";
import Holonym from "./holonym";
import Identification from "./identification";
import Implication from "./implication";
import PropertyReciprocal from "./property-reciprocal";
import Related from "./related";
import SubjectActant1Reciprocal from "./subject-actant1-reciprocal";
import SubjectSemantics from "./subject-semantics";
import Superclass from "./superclass";
import SuperordinateEntity from "./superordinate-entity";
import Synonym from "./synonym";

type ISuperclass = RelationTypes.ISuperclass;
type ISuperordinateEntity = RelationTypes.ISuperordinateEntity;
type ISynonym = RelationTypes.ISynonym;
type IAntonym = RelationTypes.IAntonym;
type IHolonym = RelationTypes.IHolonym;
type IPropertyReciprocal = RelationTypes.IPropertyReciprocal;
type ISubjectActant1Reciprocal = RelationTypes.ISubjectActant1Reciprocal;
type IActionEventEquivalent = RelationTypes.IActionEventEquivalent;
type IClassification = RelationTypes.IClassification;
type IIdentification = RelationTypes.IIdentification;
type IImplication = RelationTypes.IImplication;
type ISubjectSemantics = RelationTypes.ISubjectSemantics;
type IActant1Semantics = RelationTypes.IActant1Semantics;
type IActant2Semantics = RelationTypes.IActant2Semantics;
type IRelated = RelationTypes.IRelated;

export class UsedRelations implements RelationTypes.IUsedRelations {
  @nonenumerable
  entityId: string;
  @nonenumerable
  entityClass: EntityEnums.Class;
  @nonenumerable
  maxNestLvl = 3;
  @nonenumerable
  maxListLen = 10;

  [RelationEnums.Type.Superclass]?: RelationTypes.IDetailType<ISuperclass>;
  [RelationEnums.Type
    .SuperordinateEntity]?: RelationTypes.IDetailType<ISuperordinateEntity>;
  [RelationEnums.Type.Synonym]?: RelationTypes.IDetailType<ISynonym>;
  [RelationEnums.Type.Antonym]?: RelationTypes.IDetailType<IAntonym>;
  [RelationEnums.Type.Holonym]?: RelationTypes.IDetailType<IHolonym>;
  [RelationEnums.Type
    .PropertyReciprocal]?: RelationTypes.IDetailType<IPropertyReciprocal>;
  [RelationEnums.Type
    .SubjectActant1Reciprocal]?: RelationTypes.IDetailType<ISubjectActant1Reciprocal>;
  [RelationEnums.Type.ActionEventEquivalent]?: RelationTypes.IDetailType<
    IActionEventEquivalent,
    ISuperclass
  >;
  [RelationEnums.Type.Classification]?: RelationTypes.IDetailType<
    IClassification,
    ISuperclass
  >;
  [RelationEnums.Type
    .Identification]?: RelationTypes.IDetailType<IIdentification>;
  [RelationEnums.Type.Implication]?: RelationTypes.IDetailType<IImplication>;
  [RelationEnums.Type
    .SubjectSemantics]?: RelationTypes.IDetailType<ISubjectSemantics>;
  [RelationEnums.Type
    .Actant1Semantics]?: RelationTypes.IDetailType<IActant1Semantics>;
  [RelationEnums.Type
    .Actant2Semantics]?: RelationTypes.IDetailType<IActant2Semantics>;
  [RelationEnums.Type.Related]?: RelationTypes.IDetailType<IRelated>;
  warnings: IWarning[];

  constructor(forEntityId: string, forEntityClass: EntityEnums.Class) {
    this.entityId = forEntityId;
    this.entityClass = forEntityClass;
    this.warnings = [];
  }

  async prepareSuperclasses(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Superclass.getSuperclassForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      Superclass.getSuperclassInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.Superclass] = { connections, iConnections };
  }

  async prepareSuperordinateEntitys(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      SuperordinateEntity.getSuperordinateEntityForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      SuperordinateEntity.getSuperordinateEntityInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.SuperordinateEntity] = {
      connections,
      iConnections,
    };
  }

  async prepareSynonyms(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Synonym] = {
      connections: await Synonym.getSynonymForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareAntonyms(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Antonym] = {
      connections: await Antonym.getAntonymForwardConnections(
        dbConn,
        this.entityId
      ),
    };
  }

  async prepareHolonyms(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Holonym.getHolonymForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      Holonym.getHolonymInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.Holonym] = { connections, iConnections };
  }

  async preparePropertyReciprocals(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.PropertyReciprocal] = {
      connections:
        await PropertyReciprocal.getPropertyReciprocalForwardConnections(
          dbConn,
          this.entityId,
          this.entityClass
        ),
    };
  }

  async prepareSubjectActant1Reciprocals(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.SubjectActant1Reciprocal] = {
      connections:
        await SubjectActant1Reciprocal.getSubjectActant1ReciprocalForwardConnections(
          dbConn,
          this.entityId,
          this.entityClass
        ),
    };
  }

  async prepareActionEventEquivalents(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      ActionEventEquivalent.getActionEventEquivalentForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      ActionEventEquivalent.getActionEventEquivalentInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.ActionEventEquivalent] = {
      connections,
      iConnections,
    };
  }

  async prepareClassifications(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Classification.getClassificationForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      Classification.getClassificationInverseConnections(dbConn, this.entityId),
    ]);
    this[RelationEnums.Type.Classification] = { connections, iConnections };
  }

  async prepareIdentifications(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Identification] = {
      connections: await Identification.getIdentificationForwardConnections(
        dbConn,
        this.entityId,
        this.maxNestLvl,
        0,
        []
      ),
    };
  }

  async prepareImplications(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Implication.getImplicationForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      Implication.getImplicationInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.Implication] = { connections, iConnections };
  }

  async prepareSubjectSemantics(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      SubjectSemantics.getSubjectSemanticsForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      SubjectSemantics.getSubjectSemanticsInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.SubjectSemantics] = { connections, iConnections };
  }

  async prepareActant1Semantics(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Actant1Semantics.getActant1SemanticsForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      Actant1Semantics.getActant1SemanticsInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.Actant1Semantics] = { connections, iConnections };
  }

  async prepareActant2Semantics(dbConn: Connection): Promise<void> {
    const [connections, iConnections] = await Promise.all([
      Actant2Semantics.getActant2SemanticsForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      Actant2Semantics.getActant2SemanticsInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    ]);
    this[RelationEnums.Type.Actant2Semantics] = { connections, iConnections };
  }

  async prepareRelateds(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Related] = {
      connections: await Related.getRelatedForwardConnections(
        dbConn,
        this.entityId
      ),
    };
  }

  async prepare(req: IRequest, types: RelationEnums.Type[]): Promise<void> {
    // Each prepareX writes to a different this[type] field and only reads
    // from the connection - they're fully independent. Fan out via
    // Promise.all instead of awaiting 15 round-trips one at a time.
    const conn = req.db.connection;
    const tasks: Promise<void>[] = [];

    if (types.includes(RelationEnums.Type.Superclass)) {
      tasks.push(this.prepareSuperclasses(conn));
    }
    if (types.includes(RelationEnums.Type.SuperordinateEntity)) {
      tasks.push(this.prepareSuperordinateEntitys(conn));
    }
    if (types.includes(RelationEnums.Type.Synonym)) {
      tasks.push(this.prepareSynonyms(conn));
    }
    if (types.includes(RelationEnums.Type.Antonym)) {
      tasks.push(this.prepareAntonyms(conn));
    }
    if (types.includes(RelationEnums.Type.Holonym)) {
      tasks.push(this.prepareHolonyms(conn));
    }
    if (types.includes(RelationEnums.Type.PropertyReciprocal)) {
      tasks.push(this.preparePropertyReciprocals(conn));
    }
    if (types.includes(RelationEnums.Type.SubjectActant1Reciprocal)) {
      tasks.push(this.prepareSubjectActant1Reciprocals(conn));
    }
    if (types.includes(RelationEnums.Type.ActionEventEquivalent)) {
      tasks.push(this.prepareActionEventEquivalents(conn));
    }
    if (types.includes(RelationEnums.Type.Classification)) {
      tasks.push(this.prepareClassifications(conn));
    }
    if (types.includes(RelationEnums.Type.Identification)) {
      tasks.push(this.prepareIdentifications(conn));
    }
    if (types.includes(RelationEnums.Type.Implication)) {
      tasks.push(this.prepareImplications(conn));
    }
    if (types.includes(RelationEnums.Type.SubjectSemantics)) {
      tasks.push(this.prepareSubjectSemantics(conn));
    }
    if (types.includes(RelationEnums.Type.Actant1Semantics)) {
      tasks.push(this.prepareActant1Semantics(conn));
    }
    if (types.includes(RelationEnums.Type.Actant2Semantics)) {
      tasks.push(this.prepareActant2Semantics(conn));
    }
    if (types.includes(RelationEnums.Type.Related)) {
      tasks.push(this.prepareRelateds(conn));
    }

    await Promise.all(tasks);
  }

  getEntityIdsFromType(relationType: RelationEnums.Type): string[] {
    let out: string[] = [];

    const rel = this[relationType];
    if (rel) {
      for (const con of rel.connections) {
        out = out.concat(this.getEntityIdsFromConnection(con));
      }
      if (rel.iConnections) {
        for (const con of rel.iConnections) {
          out = out.concat(this.getEntityIdsFromConnection(con));
        }
      }
    }

    return out;
  }

  getEntityIdsFromConnection(
    con: RelationTypes.IConnection<any, any>
  ): string[] {
    let out = [...con.entityIds];
    if (con.subtrees) {
      for (const subtree of con.subtrees) {
        out = out.concat(this.getEntityIdsFromConnection(subtree));
      }
    }

    return out;
  }
}
