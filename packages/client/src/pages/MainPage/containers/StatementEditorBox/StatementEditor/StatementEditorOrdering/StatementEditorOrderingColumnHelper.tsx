import { StatementEnums } from "@shared/enums";
import {
  IEntity,
  OrderType,
  ClassificationOrder,
  IdentificationOrder,
  PropOrder,
} from "@shared/types";
import { EntityTag, EmptyTag } from "components/advanced";
import React from "react";

export const renderOrderingEntityTag = (
  entity?: IEntity,
  fallback?:
    | "actant"
    | "action"
    | "classification"
    | "identification"
    | "type"
    | "value"
    | "empty"
) => {
  return (
    <>
      {entity ? (
        <EntityTag key={entity.id} entity={entity} tooltipText={entity.label} />
      ) : (
        fallback && <EmptyTag label={fallback} />
      )}
    </>
  );
};

export const renderOrderingMainColumn = (
  orderObject: OrderType,
  entities: { [key: string]: IEntity }
) => {
  switch (orderObject.type) {
    case StatementEnums.ElementType.Actant:
      return renderOrderingEntityTag(entities[orderObject.entityId], "actant");
    case StatementEnums.ElementType.Action:
      return renderOrderingEntityTag(entities[orderObject.entityId], "action");
    case StatementEnums.ElementType.Classification:
      return renderOrderingEntityTag(
        entities[orderObject.entityId],
        "classification"
      );
    case StatementEnums.ElementType.Identification:
      return renderOrderingEntityTag(
        entities[orderObject.entityId],
        "identification"
      );
    case StatementEnums.ElementType.Prop:
      const { propValueId, propTypeId } = orderObject;
      const propTypeEntity = entities[propTypeId];
      const propValueEntity = entities[propValueId];

      return (
        <div style={{ whiteSpace: "nowrap" }}>
          {renderOrderingEntityTag(propTypeEntity, "type")}{" "}
          {renderOrderingEntityTag(propValueEntity, "value")}
        </div>
      );
  }
};

export const renderOrderingInfoColumn = (
  orderObject: OrderType,
  entities: { [key: string]: IEntity }
) => {
  switch (orderObject.type) {
    case StatementEnums.ElementType.Actant:
      return "Actant";
    case StatementEnums.ElementType.Action:
      return "Action";
    case StatementEnums.ElementType.Classification:
      return (
        <>
          {"Classification of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </>
      );
    case StatementEnums.ElementType.Identification:
      return (
        <>
          {"Identification of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </>
      );
    case StatementEnums.ElementType.Prop:
      return (
        <>
          {"Prop of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </>
      );
  }
};
