import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IPropSpec, ITerritory, Relation } from "@inkvisitor/shared/types";
import { v4 as uuidv4 } from "uuid";

type ImportJson = Record<string, unknown>;

const propSpecJson = (spec: IPropSpec, swapId: (id: string) => string) => ({
  entityId: swapId(spec.entityId),
  elvl: spec.elvl,
  logic: spec.logic,
  virtuality: spec.virtuality,
  partitivity: spec.partitivity,
});

const propJson = (prop: IProp, swapId: (id: string) => string): ImportJson => ({
  elvl: prop.elvl,
  certainty: prop.certainty,
  logic: prop.logic,
  mood: prop.mood,
  moodvariant: prop.moodvariant,
  bundleOperator: prop.bundleOperator,
  bundleStart: prop.bundleStart,
  bundleEnd: prop.bundleEnd,
  type: propSpecJson(prop.type, swapId),
  value: propSpecJson(prop.value, swapId),
  children: prop.children.map((child) => propJson(child, swapId)),
});

const dataJson = (entity: IEntity): object => {
  switch (entity.class) {
    case EntityEnums.Class.Territory: {
      const { parent, protocol } = (entity as ITerritory).data;
      // the copy lands next to the original; the order and the validation
      // rules are left out, as the import does not take them
      return {
        ...(parent ? { parent: { territoryId: parent.territoryId } } : {}),
        ...(protocol ? { protocol } : {}),
      };
    }
    case EntityEnums.Class.Resource: {
      // documents are not attached by the import
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
 * asymmetrical ones, those it is the source (entityIds[0]) of. Relations
 * pointing at it are left out, so importing the copy does not make it the
 * parent of existing entities. Tree relations come as their first level only.
 */
const outgoingRelations = (
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
 * The entity in the import format, ready to hand to an LLM as an example or to
 * import again as a clone: its own id is replaced with a fresh one everywhere
 * it appears, all other ids stay.
 */
export const buildImportJson = (
  entity: IEntity,
  relations: Relation.IUsedRelations | undefined
): ImportJson => {
  const newId = uuidv4();
  const swapId = (id: string) => (id === entity.id ? newId : id);

  return {
    id: newId,
    class: entity.class,
    labels: entity.labels,
    detail: entity.detail,
    language: entity.language,
    status: entity.status,
    notes: entity.notes,
    data: dataJson(entity),
    props: entity.props.map((prop) => propJson(prop, swapId)),
    references: entity.references.map(({ resource, value }) => ({
      resource: swapId(resource),
      value: swapId(value),
    })),
    relations: outgoingRelations(entity.id, relations).map((relation) => ({
      type: relation.type,
      entityIds: relation.entityIds.map(swapId),
      ...(relation.type === RelationEnums.Type.Identification
        ? { certainty: (relation as Relation.IIdentification).certainty }
        : {}),
    })),
  };
};
