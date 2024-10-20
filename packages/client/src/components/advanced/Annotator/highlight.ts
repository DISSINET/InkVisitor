import { HighlightSchema } from "@inkvisitor/annotator";
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
  theme: DefaultTheme | undefined
): HighlightSchema | undefined => {
  const dReferenceEntityIds: Record<EntityEnums.Class, string[]> =
    data.dataDocument?.referencedEntityIds ?? {};

  if (entityId === data.thisTerritoryEntityId) {
    return {
      mode: "focus",
      style: {
        color: "darkgrey",
        opacity: 0.7,
      },
    };
  }

  const entityClass = Object.keys(dReferenceEntityIds).find((key) =>
    dReferenceEntityIds[key as EntityEnums.Class].includes(entityId)
  );

  if (entityClass) {
    if (entityClass === EntityEnums.Class.Statement) {
      return {
        mode: "underline",
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
      mode: "background",
      style: {
        color: color,
        opacity: 0.2,
      },
    };
  }

  return undefined;
};
