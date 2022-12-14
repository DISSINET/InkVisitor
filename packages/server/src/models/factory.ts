import { UnknownObject } from "./common";
import { EntityEnums, RelationEnums } from "@shared/enums";
import Territory from "./territory/territory";
import Statement from "./statement/statement";
import Resource from "./resource/resource";
import { ModelNotValidError } from "@shared/types/errors";
import Action from "./action/action";
import Entity from "./entity/entity";
import Concept from "./concept/concept";
import Person from "./person/person";
import Being from "./being/being";
import Group from "./group/group";
import ObjectEntity from "./object/object";
import Location from "./location/location";
import Value from "./value/value";
import Event from "./event/event";
import Relation from "./relation/relation";
import Identification from "./relation/identification";
import Synonym from "./relation/synonym";
import SubjectSemantics from "./relation/subject-semantics";
import Actant1Semantics from "./relation/actant1-semantics";
import Actant2Semantics from "./relation/actant2-semantics";
import Antonym from "./relation/antonym";
import Classification from "./relation/classification";
import Holonym from "./relation/holonym";
import Implication from "./relation/implication";
import Related from "./relation/related";
import Superclass from "./relation/superclass";
import SuperordinateLocation from "./relation/superordinate-location";
import PropertyReciprocal from "./relation/property-reciprocal";
import ActionEventEquivalent from "./relation/action-event-equivalent";
import SubjectActant1Reciprocal from "./relation/subject-actant1-reciprocal";

/**
 * attempts to create new Entity instance depending on the type value
 * throws an error in case of a mismatched data/type
 * @param data
 * @returns
 */
export function getEntityClass(data: UnknownObject): Entity {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new ModelNotValidError("bad input data for entity factory");
  }

  switch (data.class as EntityEnums.Class) {
    case EntityEnums.Class.Territory:
      return new Territory(data);
    case EntityEnums.Class.Statement:
      return new Statement(data);
    case EntityEnums.Class.Person:
      return new Person(data);
    case EntityEnums.Class.Being:
      return new Being(data);
    case EntityEnums.Class.Group:
      return new Group(data);
    case EntityEnums.Class.Object:
      return new ObjectEntity(data);
    case EntityEnums.Class.Concept:
      return new Concept(data);
    case EntityEnums.Class.Location:
      return new Location(data);
    case EntityEnums.Class.Value:
      return new Value(data);
    case EntityEnums.Class.Event:
      return new Event(data);
    case EntityEnums.Class.Resource:
      return new Resource(data);
    case EntityEnums.Class.Action:
      return new Action(data);
    default:
      throw new ModelNotValidError("unknown class for entity");
  }
}

/**
 * attempts to create new instance depending on the type value
 * throws an error in case of a mismatched data/type
 * @param data
 * @returns
 */
export function getRelationClass(data: UnknownObject): Relation {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw new ModelNotValidError("bad input data for relation factory");
  }

  switch (data.type as RelationEnums.Type) {
    case RelationEnums.Type.Antonym:
      return new Antonym(data);
    case RelationEnums.Type.Classification:
      return new Classification(data);
    case RelationEnums.Type.Holonym:
      return new Holonym(data);
    case RelationEnums.Type.Implication:
      return new Implication(data);
    case RelationEnums.Type.Related:
      return new Related(data);
    case RelationEnums.Type.Superclass:
      return new Superclass(data);
    case RelationEnums.Type.SuperordinateLocation:
      return new SuperordinateLocation(data);
    case RelationEnums.Type.Identification:
      return new Identification(data);
    case RelationEnums.Type.Synonym:
      return new Synonym(data);
    case RelationEnums.Type.SubjectSemantics:
      return new SubjectSemantics(data);
    case RelationEnums.Type.Actant1Semantics:
      return new Actant1Semantics(data);
    case RelationEnums.Type.Actant2Semantics:
      return new Actant2Semantics(data);
    case RelationEnums.Type.PropertyReciprocal:
      return new PropertyReciprocal(data);
    case RelationEnums.Type.ActionEventEquivalent:
      return new ActionEventEquivalent(data);
    case RelationEnums.Type.SubjectActant1Reciprocal:
      return new SubjectActant1Reciprocal(data);
    default:
      throw new ModelNotValidError("unknown class for relation");
  }
}
