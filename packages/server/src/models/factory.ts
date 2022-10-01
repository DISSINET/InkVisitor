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
import Troponym from "./relation/troponym";

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
    case RelationEnums.Type.ActionEventEquivalent:
    case RelationEnums.Type.Antonym:
    case RelationEnums.Type.Classification:
    case RelationEnums.Type.Holonymy:
    case RelationEnums.Type.Implication:
    case RelationEnums.Type.PropertyReciprocal:
    case RelationEnums.Type.Related:
    case RelationEnums.Type.SubjectActant1Reciprocal:
    case RelationEnums.Type.Superclass:
    case RelationEnums.Type.SuperordinateLocation:
      return new Relation(data);
    case RelationEnums.Type.Identification:
      return new Identification(data);
    case RelationEnums.Type.Synonym:
      return new Synonym(data);
    case RelationEnums.Type.Troponym:
      return new Troponym(data);
    default:
      throw new ModelNotValidError("unknown class for relation");
  }
}
