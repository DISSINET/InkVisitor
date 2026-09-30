import { IEntity } from "@inkvisitor/shared/types";

// the change to save on the entity a new template was copied from,
// or null when the source stays as it is: a template copied into another
// template is not an instance of it, so only a regular entity gets linked
export const templateSourceLink = (
  source: IEntity,
  templateId: string,
): Partial<IEntity> | null =>
  source.isTemplate ? null : { usedTemplate: templateId };
