import { IEntity } from "@inkvisitor/shared/types";

// the change to save on the entity a new template was copied from,
// or null when the source stays as it is
export const templateSourceLink = (
  source: IEntity,
  templateId: string,
): Partial<IEntity> | null => ({ usedTemplate: templateId });
