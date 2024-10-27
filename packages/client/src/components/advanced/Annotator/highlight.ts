import { HighlightSchema, HighlightMode } from "@inkvisitor/annotator";
import { EntityEnums } from "@shared/enums";
import { IResponseDocumentDetail } from "@shared/types";
import { DefaultTheme } from "styled-components";
import { EntityColors } from "types";

interface annotatorHighlightData {
  thisTerritoryEntityId: string | undefined;
  dataDocument: IResponseDocumentDetail;
}

export const annotatorHighlight = (
  entityId: string,
  data: annotatorHighlightData,
  hlEntities: EntityEnums.Class[],
  theme: DefaultTheme | undefined
): HighlightSchema | undefined => {
  const dReferenceEntityIds: Record<EntityEnums.Class, string[]> =
    data.dataDocument?.referencedEntityIds ?? {};

  if (entityId === data.thisTerritoryEntityId) {
    return {
      mode: HighlightMode.FOCUS,
      style: {
        color: "black",
        opacity: 0.6,
      },
    };
  }

  const entityClass = Object.keys(dReferenceEntityIds).find((key) =>
    dReferenceEntityIds[key as EntityEnums.Class].includes(entityId)
  );

  if (entityClass && hlEntities.includes(entityClass as EntityEnums.Class)) {
    if (entityClass === EntityEnums.Class.Statement) {
      return {
        mode: HighlightMode.UNDERLINE,
        style: {
          color: theme?.color.entityS as string,
          opacity: 1,
        },
      };
    }
    if (entityClass === EntityEnums.Class.Territory) {
      return undefined;
    }

    const classItem = EntityColors[entityClass];
    const colorName = classItem?.color ?? "transparent";
    const color = theme?.color[colorName] as string;

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
