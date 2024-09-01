import { HighlightSchema } from "@inkvisitor/annotator";
import { EntityEnums } from "@shared/enums";
import { IResponseDocumentDetail } from "@shared/types";
import { DefaultTheme } from "styled-components";
import { EntityColors } from "types";

interface annotatorHighlightData {
  thisTerritoryEntityId: string | undefined;
  document: IResponseDocumentDetail;
}

export const annotatorHighlight = (
  entityId: string,
  data: annotatorHighlightData,
  theme: DefaultTheme | undefined
): HighlightSchema => {
  const dReferenceEntityIds: Record<EntityEnums.Class, string[]> =
    data.document?.referencedEntityIds ?? {};
  if (entityId === data.thisTerritoryEntityId) {
    return {
      mode: "background",
      style: {
        fillColor: theme?.color.warning,
        fillOpacity: 0.8,
      },
    };
  }

  const entityClass = Object.keys(dReferenceEntityIds).find((key) =>
    dReferenceEntityIds[key as EntityEnums.Class].includes(entityId)
  );

  if (entityClass) {
    const classItem = EntityColors[entityClass];
    const colorName = classItem?.color ?? "transparent";
    const color = theme?.color[colorName] as string;

    return {
      mode: "background",
      style: {
        fillColor: color,
        fillOpacity: 0.3,
      },
    };
  } else {
    return {
      mode: "background",
      style: {
        fillColor: "transparent",
        fillOpacity: 0,
      },
    };
  }
};
