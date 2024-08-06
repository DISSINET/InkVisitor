import { nonenumerable } from "@common/decorators";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { IWarning, Relation as RelationTypes } from "@shared/types";
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
import Synonym from "./synonym";
import SuperordinateEntity from "./superordinate-entity";

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
    this[RelationEnums.Type.Superclass] = {
      connections: await Superclass.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      iConnections: await Superclass.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareSuperordinateEntitys(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.SuperordinateEntity] = {
      connections:
        await SuperordinateEntity.getSuperordinateEntityForwardConnections(
          dbConn,
          this.entityId,
          this.entityClass,
          this.maxNestLvl,
          0
        ),
      iConnections:
        await SuperordinateEntity.getSuperordinateEntityInverseConnections(
          dbConn,
          this.entityId,
          this.entityClass
        ),
    };
  }

  async prepareSynonyms(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Synonym] = {
      connections: await Synonym.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareAntonyms(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Antonym] = {
      connections: await Antonym.getForwardConnections(dbConn, this.entityId),
    };
  }

  async prepareHolonyms(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Holonym] = {
      connections: await Holonym.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      iConnections: await Holonym.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async preparePropertyReciprocals(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.PropertyReciprocal] = {
      connections: await PropertyReciprocal.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareSubjectActant1Reciprocals(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.SubjectActant1Reciprocal] = {
      connections: await SubjectActant1Reciprocal.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareActionEventEquivalents(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.ActionEventEquivalent] = {
      connections: await ActionEventEquivalent.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      iConnections: await ActionEventEquivalent.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareClassifications(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Classification] = {
      connections: await Classification.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass,
        this.maxNestLvl,
        0
      ),
      iConnections: await Classification.getInverseConnections(
        dbConn,
        this.entityId
      ),
    };
  }

  async prepareIdentifications(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Identification] = {
      connections: await Identification.getForwardConnections(
        dbConn,
        this.entityId,
        this.maxNestLvl,
        0,
        []
      ),
    };
  }

  async prepareImplications(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Implication] = {
      connections: await Implication.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      iConnections: await Implication.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareSubjectSemantics(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.SubjectSemantics] = {
      connections: await SubjectSemantics.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      iConnections: await SubjectSemantics.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareActant1Semantics(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Actant1Semantics] = {
      connections: await Actant1Semantics.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      iConnections: await Actant1Semantics.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareActant2Semantics(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Actant2Semantics] = {
      connections: await Actant2Semantics.getForwardConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
      iConnections: await Actant2Semantics.getInverseConnections(
        dbConn,
        this.entityId,
        this.entityClass
      ),
    };
  }

  async prepareRelateds(dbConn: Connection): Promise<void> {
    this[RelationEnums.Type.Related] = {
      connections: await Related.getForwardConnections(dbConn, this.entityId),
    };
  }

  async prepare(req: IRequest, types: RelationEnums.Type[]): Promise<void> {
    if (types.indexOf(RelationEnums.Type.Superclass) != -1) {
      await this.prepareSuperclasses(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.SuperordinateEntity) != -1) {
      await this.prepareSuperordinateEntitys(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Synonym) != -1) {
      await this.prepareSynonyms(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Antonym) != -1) {
      await this.prepareAntonyms(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Holonym) != -1) {
      await this.prepareHolonyms(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.PropertyReciprocal) != -1) {
      await this.preparePropertyReciprocals(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.SubjectActant1Reciprocal) != -1) {
      await this.prepareSubjectActant1Reciprocals(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.ActionEventEquivalent) != -1) {
      await this.prepareActionEventEquivalents(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Classification) != -1) {
      await this.prepareClassifications(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Identification) != -1) {
      await this.prepareIdentifications(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Implication) != -1) {
      await this.prepareImplications(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.SubjectSemantics) != -1) {
      await this.prepareSubjectSemantics(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Actant1Semantics) != -1) {
      await this.prepareActant1Semantics(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Actant2Semantics) != -1) {
      await this.prepareActant2Semantics(req.db.connection);
    }

    if (types.indexOf(RelationEnums.Type.Related) != -1) {
      await this.prepareRelateds(req.db.connection);
    }
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
