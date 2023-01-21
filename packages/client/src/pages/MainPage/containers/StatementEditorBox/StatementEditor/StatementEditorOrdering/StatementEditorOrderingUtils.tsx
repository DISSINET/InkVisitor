import { StatementEnums } from "@shared/enums";
import { IEntity, OrderType } from "@shared/types";
import { EmptyTag, EntityTag } from "components/advanced";
import React from "react";
import {
  StyledInfoColumn,
  StyledInfoText,
  StyledMainColumn,
  StyledSeparator,
  StyledTableTextGridCell,
  StyledTagWrap,
} from "./StatementEditorOrderingStyles";

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
      const propValueEntity = entities[propValueId];
      const propTypeEntity = entities[propTypeId];

      return (
        <StyledMainColumn>
          {renderOrderingEntityTag(propTypeEntity, "type")}
          <StyledSeparator />
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
          <StyledInfoText>{"Classification of"}</StyledInfoText>
          <StyledSeparator />
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
    case StatementEnums.ElementType.Identification:
      return (
        <StyledInfoColumn>
          <StyledInfoText>{"Identification of"}</StyledInfoText>
          <StyledSeparator />
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
    case StatementEnums.ElementType.Prop:
      return (
        <StyledInfoColumn>
          <StyledInfoText>{"Prop of"}</StyledInfoText>
          <StyledSeparator />
          {renderOrderingEntityTag(entities[orderObject.originId], "empty")}
        </StyledInfoColumn>
      );
  }
};
