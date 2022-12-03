import { nonenumerable } from "@common/decorators";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { Relation as RelationTypes } from "@shared/types";
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
import SuperordinateLocation from "./superordinate-location";
import Synonym from "./synonym";

type ISuperclass = RelationTypes.ISuperclass;
type ISuperordinateLocation = RelationTypes.ISuperordinateLocation;
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
    maxNestLvl: number = 3;
    maxListLen: number = 10;

    [RelationEnums.Type.Superclass]?: RelationTypes.IDetailType<ISuperclass>;
    [RelationEnums.Type.SuperordinateLocation]?: RelationTypes.IDetailType<ISuperordinateLocation>;
    [RelationEnums.Type.Synonym]?: RelationTypes.IDetailType<ISynonym>;
    [RelationEnums.Type.Antonym]?: RelationTypes.IDetailType<IAntonym>;
    [RelationEnums.Type.Holonym]?: RelationTypes.IDetailType<IHolonym>;
    [RelationEnums.Type.PropertyReciprocal]?: RelationTypes.IDetailType<IPropertyReciprocal>;
    [RelationEnums.Type.SubjectActant1Reciprocal]?: RelationTypes.IDetailType<ISubjectActant1Reciprocal>;
    [RelationEnums.Type.ActionEventEquivalent]?: RelationTypes.IDetailType<IActionEventEquivalent, ISuperclass>;
    [RelationEnums.Type.Classification]?: RelationTypes.IDetailType<IClassification, ISuperclass>;
    [RelationEnums.Type.Identification]?: RelationTypes.IDetailType<IIdentification>;
    [RelationEnums.Type.Implication]?: RelationTypes.IDetailType<IImplication>;
    [RelationEnums.Type.SubjectSemantics]?: RelationTypes.IDetailType<ISubjectSemantics>;
    [RelationEnums.Type.Actant1Semantics]?: RelationTypes.IDetailType<IActant1Semantics>;
    [RelationEnums.Type.Actant2Semantics]?: RelationTypes.IDetailType<IActant2Semantics>;
    [RelationEnums.Type.Related]?: RelationTypes.IDetailType<IRelated>;

    constructor(forEntityId: string, forEntityClass: EntityEnums.Class) {
        this.entityId = forEntityId;
        this.entityClass = forEntityClass;
    }

    async prepareSuperclasses(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Superclass] = {
            connections: await Superclass.getSuperclassForwardConnections(dbConn, this.entityId, this.entityClass, this.maxNestLvl, 0),
            iConnections: await Superclass.getSuperclassInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSuperordinateLocations(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SuperordinateLocation] = {
            connections: await SuperordinateLocation.getSuperordinateLocationForwardConnections(dbConn, this.entityId, this.entityClass, this.maxNestLvl, 0),
            iConnections: await SuperordinateLocation.getSuperordinateLocationInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSynonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Synonym] = {
            connections: await Synonym.getSynonymForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareAntonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Antonym] = {
            connections: await Antonym.getAntonymForwardConnections(dbConn, this.entityId),
        };
    }

    async prepareHolonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Holonym] = {
            connections: await Holonym.getHolonymForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await Holonym.getHolonymInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async preparePropertyReciprocals(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.PropertyReciprocal] = {
            connections: await PropertyReciprocal.getPropertyReciprocalForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSubjectActant1Reciprocals(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SubjectActant1Reciprocal] = {
            connections: await SubjectActant1Reciprocal.getSubjectActant1ReciprocalForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareActionEventEquivalents(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.ActionEventEquivalent] = {
            connections: await ActionEventEquivalent.getActionEventEquivalentForwardConnections(dbConn, this.entityId, this.entityClass, this.maxNestLvl, 0),
            iConnections: await ActionEventEquivalent.getActionEventEquivalentInverseConnections(dbConn, this.entityId, this.entityClass)
        };
    }

    async prepareClassifications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Classification] = {
            connections: await Classification.getClassificationForwardConnections(dbConn, this.entityId, this.entityClass, this.maxNestLvl, 0),
            iConnections: await Classification.getClassificationInverseConnections(dbConn, this.entityId),
        };
    }

    async prepareIdentifications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Identification] = {
            connections: await Identification.getIdentificationForwardConnections(dbConn, this.entityId, EntityEnums.Certainty.Certain, this.maxNestLvl, 0),
        };
    }

    async prepareImplications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Implication] = {
            connections: await Implication.getImplicationForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await Implication.getImplicationInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSubjectSemantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SubjectSemantics] = {
            connections: await SubjectSemantics.getSubjectSemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await SubjectSemantics.getSubjectSemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }


    async prepareActant1Semantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Actant1Semantics] = {
            connections: await Actant1Semantics.getActant1SemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await Actant1Semantics.getActant1SemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareActant2Semantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Actant2Semantics] = {
            connections: await Actant2Semantics.getActant2SemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await Actant2Semantics.getActant2SemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareRelateds(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Related] = {
            connections: await Related.getRelatedForwardConnections(dbConn, this.entityId),
        };
    }

    async prepareAll(req: IRequest): Promise<void> {
        await this.prepareSuperclasses(req.db.connection);
        await this.prepareSuperordinateLocations(req.db.connection);
        await this.prepareSynonyms(req.db.connection);
        await this.prepareAntonyms(req.db.connection);
        await this.prepareHolonyms(req.db.connection);
        await this.preparePropertyReciprocals(req.db.connection);
        await this.prepareSubjectActant1Reciprocals(req.db.connection);
        await this.prepareActionEventEquivalents(req.db.connection);
        await this.prepareClassifications(req.db.connection);
        await this.prepareIdentifications(req.db.connection);
        await this.prepareImplications(req.db.connection);
        await this.prepareSubjectSemantics(req.db.connection);
        await this.prepareActant1Semantics(req.db.connection);
        await this.prepareActant2Semantics(req.db.connection);
        await this.prepareRelateds(req.db.connection);
    }
}