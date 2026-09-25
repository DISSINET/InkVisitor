import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IPropSpec, ITerritory, Relation } from "@inkvisitor/shared/types";

type EntityJson = Record<string, unknown>;

const propSpecJson = (spec: IPropSpec) => ({
  entityId: spec.entityId,
  elvl: spec.elvl,
  logic: spec.logic,
  virtuality: spec.virtuality,
  partitivity: spec.partitivity,
});

const propJson = (prop: IProp): EntityJson => ({
  elvl: prop.elvl,
  certainty: prop.certainty,
  logic: prop.logic,
  mood: prop.mood,
  moodvariant: prop.moodvariant,
  bundleOperator: prop.bundleOperator,
  bundleStart: prop.bundleStart,
  bundleEnd: prop.bundleEnd,
  type: propSpecJson(prop.type),
  value: propSpecJson(prop.value),
  children: prop.children.map(propJson),
});

const dataJson = (entity: IEntity): object => {
  switch (entity.class) {
    case EntityEnums.Class.Territory: {
      // the order is set by moving the territory in the tree, not in Detail
      const { parent, protocol, validations } = (entity as ITerritory).data;
      return {
        ...(parent ? { parent: { territoryId: parent.territoryId } } : {}),
        ...(protocol ? { protocol } : {}),
        ...(validations ? { validations } : {}),
      };
    }
    case EntityEnums.Class.Resource: {
      // a document is attached in the document view, not in Detail
      const data = { ...entity.data };
      delete data.documentId;
      return data;
    }
    default:
      return entity.data ?? {};
  }
};

/**
 * The relations this entity states itself: the symmetrical ones and, for the
 * asymmetrical ones, those it is the source (entityIds[0]) of - the ones Detail
 * lets it set. Tree relations come as their first level only.
 */
const ownRelations = (
  entityId: string,
  relations: Relation.IUsedRelations | undefined
): Relation.IRelation[] => {
  const out: Relation.IRelation[] = [];
  for (const [type, detailType] of Object.entries(relations ?? {})) {
    const rule = Relation.RelationRules[type as RelationEnums.Type];
    if (!rule || !detailType) {
      continue;
    }
    for (const connection of detailType.connections) {
      if (!rule.asymmetrical || connection.entityIds[0] === entityId) {
        out.push(connection);
      }
    }
  }
  return out;
};

/**
 * The entity as the JSON section of Detail shows it: only what Detail lets the
 * user edit, in the format the JSON import reads. Copied, edited (with a new
 * id) and imported, it creates the edited entity.
 */
export const buildEntityJson = (
  entity: IEntity,
  relations: Relation.IUsedRelations | undefined
): EntityJson => ({
  id: entity.id,
  class: entity.class,
  labels: entity.labels,
  detail: entity.detail,
  language: entity.language,
  status: entity.status,
  notes: entity.notes,
  data: dataJson(entity),
  props: entity.props.map(propJson),
  references: entity.references.map(({ resource, value }) => ({ resource, value })),
  relations: ownRelations(entity.id, relations).map((relation) => ({
    type: relation.type,
    entityIds: relation.entityIds,
    ...(relation.type === RelationEnums.Type.Identification
      ? { certainty: (relation as Relation.IIdentification).certainty }
      : {}),
  })),
});
