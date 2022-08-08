import { EntityStatus } from "@shared/enums";

import memoize from "memoize-one";
import React from "react";
import { FaPlayCircle } from "react-icons/fa";
import theme from "Theme/theme";

import {
  StyledSuggestionLineActions,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledSuggestionRow,
  StyledTagWrapper,
} from "../SuggesterStyles";
import { areEqual } from "react-window";
import { Tag } from "components";
import { EntitySuggestion } from "types";
import { IEntity } from "@shared/types";
import { ImInsertTemplate } from "react-icons/im";

export const createItemData = memoize(
  (
    items: EntitySuggestion[],
    onPick: (entity: IEntity) => void,
    selected: number,
    isInsideTemplate: boolean
  ) => ({
    items,
    onPick,
    selected,
    isInsideTemplate,
  })
);

export type SuggestionRowEntityItemData = {
  items: EntitySuggestion[];
  onPick: (entity: IEntity) => void;
  selected: number;
  isInsideTemplate: boolean;
};

interface EntityRow {
  data: SuggestionRowEntityItemData;
  index: number;
  style: any;
}
const EntityRow: React.FC<EntityRow> = ({ data, index, style }) => {
  const { items, onPick, selected, isInsideTemplate } = data;
  const { entity, icons } = items[index];
  const isNotDiscouraged = entity.status !== EntityStatus.Discouraged;

  return (
    <StyledSuggestionRow key={index} style={style}>
      <StyledSuggestionLineActions isSelected={selected === index}>
        {!entity.isTemplate && isNotDiscouraged && (
          <FaPlayCircle
            color={theme.color["black"]}
            onClick={() => {
              // onPick nonTemplate entity
              onPick(entity);
            }}
          />
        )}

        {/* NOT INSIDE TEMPLATE */}
        {/* TODO: Icon for entity.isTemplate => duplicate to entity (the same one?) */}
        {entity.isTemplate && !isInsideTemplate && isNotDiscouraged && (
          <FaPlayCircle
            color={theme.color["info"]}
            onClick={() => {
              // onTemplatePick(entity);
              console.log("Duplicate to entity");
            }}
          />
        )}

        {/* INSIDE TEMPLATE */}
        {/* TODO: Icon for is template inside template => use template */}
        {entity.isTemplate && isInsideTemplate && isNotDiscouraged && (
          <>
            <FaPlayCircle
              color={theme.color["warning"]}
              onClick={() => {
                // TODO: duplicate to entity
                // onTemplatePick(entity);
                console.log("Duplicate to entity");
              }}
            />
            <ImInsertTemplate
              color={theme.color["danger"]}
              onClick={() => {
                // onPick template entity
                onPick(entity);
              }}
            />
          </>
        )}
      </StyledSuggestionLineActions>
      <StyledSuggestionLineTag isSelected={selected === index}>
        <StyledTagWrapper>
          <Tag
            fullWidth
            propId={entity.id}
            label={entity.label}
            status={entity.status}
            ltype={entity.data.logicalType}
            tooltipDetail={entity.detail}
            entityClass={entity.class}
            isTemplate={entity.isTemplate}
          />
        </StyledTagWrapper>
      </StyledSuggestionLineTag>
      <StyledSuggestionLineIcons isSelected={selected === index}>
        {icons}
      </StyledSuggestionLineIcons>
    </StyledSuggestionRow>
  );
};

export const MemoizedEntityRow = React.memo(EntityRow, areEqual);
