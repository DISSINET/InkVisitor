import { HighlightMode, HighlightSchema } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { DefaultTheme } from "styled-components";
import { EntityColors } from "types";
import { IDocument } from "@inkvisitor/shared/types";
interface annotatorHighlightData {
  thisTerritoryEntityId: string | undefined;
  dataDocument: IDocument;
}

export const annotatorHighlight = (
  entityId: string,
  data: annotatorHighlightData,
  hlClasses: EntityEnums.Class[],
  theme: DefaultTheme | undefined,
): HighlightSchema | undefined => {
  if (!theme) {
    return undefined;
  }

  const dReferenceEntityIds: Record<EntityEnums.Class, string[]> =
    data.dataDocument?.entityIds ?? {};

  if (entityId === data.thisTerritoryEntityId) {
    return {
      mode: HighlightMode.FOCUS,
      style: {
        color: theme.color["black"],
        opacity: 0.08,
      },
    };
  }

  const entityClass = Object.keys(dReferenceEntityIds).find((key) =>
    dReferenceEntityIds[key as EntityEnums.Class].includes(entityId),
  );

  if (entityClass && hlClasses && hlClasses.includes(entityClass as EntityEnums.Class)) {
    if (entityClass === EntityEnums.Class.Statement) {
      return {
        mode: HighlightMode.UNDERLINE,
        style: {
          color: theme.color.entityS,
          opacity: 1,
        },
      };
    }
    if (entityClass === EntityEnums.Class.Territory) {
      // #2887 — a Territory anchor spans a whole territory; filling it as a
      // highlight would flood the fulltext. Draw only corner markers at the
      // anchor ends (ANCHOR mode) so child/sibling territories stay visible in
      // basic highlight view without overwhelming the text.
      return {
        mode: HighlightMode.ANCHOR,
        style: {
          color: theme.color.entityT,
          opacity: 1,
        },
      };
    }

    const classItem = EntityColors[entityClass];
    const colorName = classItem?.color ?? "transparent";
    const color = theme.color[colorName];

    return {
      mode: HighlightMode.BACKGROUND,
      style: {
        color: color,
        opacity: 0.4,
      },
    };
  }

  return undefined;
};
