import { StatementEnums } from "@shared/enums";
import { IEntity, OrderType } from "@shared/types";
import { EmptyTag, EntityTag } from "components/advanced";
import React from "react";
import {
  StyledInfoColumn,
  StyledMainColumn,
  StyledTableTextGridCell,
  StyledTagWrap,
} from "./StatementEditorOrderingColumnHelperStyles";

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
        <StyledTableTextGridCell>
          <StyledTagWrap>
            <EntityTag
              key={entity.id}
              entity={entity}
              tooltipText={entity.label}
              // fullWidth
            />
          </StyledTagWrap>
        </StyledTableTextGridCell>
      ) : (
        fallback && (
          <div>
            <EmptyTag label={fallback} />
          </div>
        )
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
        <StyledMainColumn>
          {renderOrderingEntityTag(propTypeEntity, "type")}{" "}
          {renderOrderingEntityTag(propValueEntity, "value")}
        </StyledMainColumn>
      );
  }
};

export const renderOrderingInfoColumn = (
  orderObject: OrderType,
  entities: { [key: string]: IEntity }
) => {
  switch (orderObject.type) {
    case StatementEnums.ElementType.Actant:
      return <StyledInfoColumn>{"Actant"}</StyledInfoColumn>;
    case StatementEnums.ElementType.Action:
      return <StyledInfoColumn>{"Action"}</StyledInfoColumn>;
    case StatementEnums.ElementType.Classification:
      return (
        <StyledInfoColumn>
          {"Classification of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
    case StatementEnums.ElementType.Identification:
      return (
        <StyledInfoColumn>
          {"Identification of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
    case StatementEnums.ElementType.Prop:
      return (
        <StyledInfoColumn>
          {"Prop of "}
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
  }
};
