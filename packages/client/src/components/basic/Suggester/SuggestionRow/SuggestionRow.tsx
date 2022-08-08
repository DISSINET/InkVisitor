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
import { EntitySuggestionI } from "types";
import { IEntity } from "@shared/types";

export const createItemData = memoize(
  (
    items: EntitySuggestionI[],
    onPick: (entity: IEntity) => void,
    selected: number
  ) => ({
    items,
    onPick,
    selected,
  })
);

export type EntityItemData = {
  items: EntitySuggestionI[];
  onPick: (entity: IEntity) => void;
  selected: number;
};

interface EntityRow {
  data: EntityItemData;
  index: number;
  style: any;
}
const EntityRow: React.FC<EntityRow> = ({ data, index, style }) => {
  const { items, onPick, selected } = data;
  const { entity, icons } = items[index];

  return (
    <StyledSuggestionRow key={index} style={style}>
      <StyledSuggestionLineActions isSelected={selected === index}>
        {entity.status !== EntityStatus.Discouraged && (
          <FaPlayCircle
            color={theme.color["black"]}
            onClick={() => {
              onPick(entity);
            }}
          />
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
