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
 * lets it set. `relations` must all include the entity.
 */
const ownRelations = (entityId: string, relations: Relation.IRelation[]): Relation.IRelation[] =>
  relations.filter((relation) => {
    const rule = Relation.RelationRules[relation.type];
    return !!rule && (!rule.asymmetrical || relation.entityIds[0] === entityId);
  });

/** The relations Detail lists for the entity; tree relations as their first level only. */
const detailConnections = (relations: Relation.IUsedRelations | undefined): Relation.IRelation[] =>
  Object.values(relations ?? {}).flatMap(
    (detailType) => (detailType?.connections ?? []) as Relation.IRelation[]
  );

/**
 * buildEntityJson from the stored relations the entity is in, rather than from
 * the relations of its Detail.
 */
export const buildEntityJsonFromRelations = (
  entity: IEntity,
  relations: Relation.IRelation[]
): EntityJson => ({
  id: entity.id,
  ...(entity.legacyId ? { legacyId: entity.legacyId } : {}),
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

/**
 * The entity as the JSON section of Detail shows it: only what Detail lets the
 * user edit, in the format the JSON import reads. Copied, edited (with a new
 * id) and imported, it creates the edited entity.
 */
export const buildEntityJson = (
  entity: IEntity,
  relations: Relation.IUsedRelations | undefined
): EntityJson => buildEntityJsonFromRelations(entity, detailConnections(relations));
