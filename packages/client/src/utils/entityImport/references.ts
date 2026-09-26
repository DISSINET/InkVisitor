import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, ITerritory } from "@inkvisitor/shared/types";
import { classList, className, quote } from "./helpers";
import { ImportEntity, ImportIssue } from "./types";

/** One entity id an input entity points at, with the classes it may have. */
export interface EntityRef {
  entityIndex: number;
  label: string;
  path: string;
  id: string;
  // undefined: any class
  classes?: EntityEnums.Class[];
}

const PROTOCOL_REF_CLASSES: Record<string, EntityEnums.Class> = {
  dataCollectionMethods: EntityEnums.Class.Concept,
  guidelines: EntityEnums.Class.Resource,
  detailedProtocols: EntityEnums.Class.Resource,
  relatedDataPublications: EntityEnums.Class.Resource,
  startDate: EntityEnums.Class.Value,
  endDate: EntityEnums.Class.Value,
};

const collectPropRefs = (props: IProp[], path: string, add: (path: string, id: string) => void) => {
  props.forEach((prop, propIndex) => {
    const propPath = `${path}[${propIndex}]`;
    add(`${propPath}.type.entityId`, prop.type.entityId);
    add(`${propPath}.value.entityId`, prop.value.entityId);
    collectPropRefs(prop.children, `${propPath}.children`, add);
  });
};

/** Every entity id in the props, references and territory data of the input. */
export const collectEntityRefs = (entities: ImportEntity[]): EntityRef[] => {
  const refs: EntityRef[] = [];

  for (const { index, entity } of entities) {
    const add = (path: string, id: string, classes?: EntityEnums.Class[]) => {
      if (id) {
        refs.push({ entityIndex: index, label: entity.labels[0], path, id, classes });
      }
    };

    collectPropRefs(entity.props, "props", add);

    entity.references.forEach((reference, referenceIndex) => {
      add(`references[${referenceIndex}].resource`, reference.resource, [
        EntityEnums.Class.Resource,
      ]);
      add(`references[${referenceIndex}].value`, reference.value, [EntityEnums.Class.Value]);
    });

    if (entity.class === EntityEnums.Class.Territory) {
      const data = (entity as ITerritory).data;
      if (data.parent) {
        add("data.parent.territoryId", data.parent.territoryId, [EntityEnums.Class.Territory]);
      }
      if (data.protocol) {
        for (const [key, entityClass] of Object.entries(PROTOCOL_REF_CLASSES)) {
          const value = (data.protocol as unknown as Record<string, string | string[]>)[key];
          if (Array.isArray(value)) {
            value.forEach((id, idIndex) =>
              add(`data.protocol.${key}[${idIndex}]`, id, [entityClass])
            );
          } else {
            add(`data.protocol.${key}`, value, [entityClass]);
          }
        }
      }
    }
  }

  return refs;
};

/**
 * Every referenced id must name an entity of the input or of the database; a
 * database entity must not be a template (the server refuses to link one into
 * an entity instance) and must be of the class the field takes.
 */
export const validateEntityRefs = (
  refs: EntityRef[],
  batch: Map<string, IEntity>,
  existing: Map<string, IEntity>
): ImportIssue[] => {
  const errors: ImportIssue[] = [];

  for (const ref of refs) {
    const report = (message: string) =>
      errors.push({ entityIndex: ref.entityIndex, label: ref.label, path: ref.path, message });

    const target = batch.get(ref.id) ?? existing.get(ref.id);
    if (!target) {
      report(`UUID ${quote(ref.id)} not found in the database or the input`);
    } else if (!batch.has(ref.id) && target.isTemplate) {
      report(`${quote(target.labels[0])} is a template; templates can't be linked`);
    } else if (ref.classes && !ref.classes.includes(target.class)) {
      report(
        `must be ${classList(ref.classes)}; ${quote(target.labels[0])} is a ${className(target.class)}`
      );
    }
  }

  return errors;
};

/**
 * Ids must be unique within the input and new to the database: the import
 * creates entities, it never overwrites one.
 */
export const validateBatchIds = (
  entities: ImportEntity[],
  existingIds: Set<string>
): ImportIssue[] => {
  const errors: ImportIssue[] = [];
  const firstIndexById = new Map<string, number>();

  for (const { index, entity } of entities) {
    const report = (message: string) =>
      errors.push({ entityIndex: index, label: entity.labels[0], path: "id", message });

    const firstIndex = firstIndexById.get(entity.id);
    if (firstIndex !== undefined) {
      report(`id ${quote(entity.id)} is already used by entity ${firstIndex}`);
    } else {
      firstIndexById.set(entity.id, index);
      if (existingIds.has(entity.id)) {
        report(`id ${quote(entity.id)} already exists in the database`);
      }
    }
  }

  return errors;
};
