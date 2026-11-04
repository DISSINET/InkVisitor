import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";

export type TemplateOrder = "label" | "class" | "newest";

export const templateOrderOptions: { value: TemplateOrder; label: string }[] = [
  { value: "label", label: "label" },
  { value: "class", label: "class" },
  { value: "newest", label: "newest" },
];

const classOrder = new Map(entitiesDict.map((entity, index) => [entity.value, index]));

// a template without a creation date counts as the oldest
const createdTime = (template: IEntity) =>
  template.createdAt ? new Date(template.createdAt).getTime() : 0;

/**
 * Sorts templates in place, the promoted class first in every order. The
 * caller passes them sorted by label, and the stable sort keeps that order
 * among templates the chosen order ranks equal.
 */
export const sortTemplates = (
  templates: IEntity[],
  order: TemplateOrder,
  promotedClass?: EntityEnums.Class | EntityEnums.Extension.Any,
): IEntity[] => {
  const rank = (template: IEntity) => (template.class === promotedClass ? 0 : 1);
  return templates.sort((a, b) => {
    if (rank(a) !== rank(b)) {
      return rank(a) - rank(b);
    }
    if (order === "class") {
      return (classOrder.get(a.class) ?? 0) - (classOrder.get(b.class) ?? 0);
    }
    if (order === "newest") {
      return createdTime(b) - createdTime(a);
    }
    return 0;
  });
};
