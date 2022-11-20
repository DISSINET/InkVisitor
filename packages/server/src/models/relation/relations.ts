import { nonenumerable } from "@common/decorators";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import { getActant1SemanticsForwardConnections, getActant1SemanticsInverseConnections, getActant2SemanticsForwardConnections, getActant2SemanticsInverseConnections, getActionEventEquivalentForwardConnections, getActionEventEquivalentInverseConnections, getAntonymForwardConnections, getClassificationForwardConnections, getClassificationInverseConnections, getHolonymForwardConnections, getIdentificationForwardConnections, getIdentificationInverseConnections, getImplicationForwardConnections, getImplicationInverseConnections, getPropertyReciprocalForwardConnections, getSubjectActant1ReciprocalForwardConnections, getSubjectSemanticsForwardConnections, getSubjectSemanticsInverseConnections, getSuperclassForwardConnections, getSuperclassInverseConnections, getSuperclassTrees, getSuperordinateLocationForwardConnections, getSuperordinateLocationInverseConnections, getSynonymForwardConnections } from "./functions";
import Relation from './relation';

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
            connections: await getSuperclassForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getSuperclassInverseConnections(dbConn, this.entityId)
        };
    }

    async prepareSuperordinateLocations(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SuperordinateLocation] = {
            connections: await getSuperordinateLocationForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getSuperordinateLocationInverseConnections(dbConn, this.entityId)
        };
    }

    async prepareSynonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Synonym] = {
            connections: await getSynonymForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareAntonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Antonym] = {
            connections: await getAntonymForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareHolonyms(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Holonym] = {
            connections: await getHolonymForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async preparePropertyReciprocals(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.PropertyReciprocal] = {
            connections: await getPropertyReciprocalForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSubjectActant1Reciprocals(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SubjectActant1Reciprocal] = {
            connections: await getSubjectActant1ReciprocalForwardConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareActionEventEquivalents(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.ActionEventEquivalent] = {
            connections: await getActionEventEquivalentForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getActionEventEquivalentInverseConnections(dbConn, this.entityId)
        };
    }

    async prepareClassifications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Classification] = {
            connections: await getClassificationForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getClassificationInverseConnections(dbConn, this.entityId),
        };
    }

    async prepareIdentifications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Identification] = {
            connections: await getIdentificationForwardConnections(dbConn, this.entityId, EntityEnums.Certainty.Certain),
        };
    }

    async prepareImplications(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Implication] = {
            connections: await getImplicationForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getImplicationInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareSubjectSemantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.SubjectSemantics] = {
            connections: await getSubjectSemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getSubjectSemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }


    async prepareActant1Semantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Actant1Semantics] = {
            connections: await getActant1SemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getActant1SemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
        };
    }

    async prepareActant2Semantics(dbConn: Connection): Promise<void> {
        this[RelationEnums.Type.Actant2Semantics] = {
            connections: await getActant2SemanticsForwardConnections(dbConn, this.entityId, this.entityClass),
            iConnections: await getActant2SemanticsInverseConnections(dbConn, this.entityId, this.entityClass),
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
    }
}