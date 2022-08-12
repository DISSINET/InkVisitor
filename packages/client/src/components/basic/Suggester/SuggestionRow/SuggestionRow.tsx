import { EntityClass, EntityStatus } from "@shared/enums";

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
import { Tag, Tooltip } from "components";
import { EntitySuggestion } from "types";
import { IEntity } from "@shared/types";
import { ImInsertTemplate } from "react-icons/im";
import { BiDuplicate } from "react-icons/bi";

export const createItemData = memoize(
  (
    items,
    onPick,
    selected,
    isInsideTemplate,
    territoryParentId
  ): SuggestionRowEntityItemData => ({
    items,
    onPick,
    selected,
    isInsideTemplate,
    territoryParentId,
  })
);

export type SuggestionRowEntityItemData = {
  items: EntitySuggestion[];
  onPick: (entity: IEntity, duplicate?: boolean) => void;
  selected: number;
  isInsideTemplate: boolean;
  territoryParentId: string;
};

interface EntityRow {
  data: SuggestionRowEntityItemData;
  index: number;
  style: any;
}
const EntityRow: React.FC<EntityRow> = ({ data, index, style }) => {
  const { items, onPick, selected, isInsideTemplate, territoryParentId } = data;
  const { entity, icons } = items[index];
  const isNotDiscouraged = entity.status !== EntityStatus.Discouraged;
  const territoryWithoutParent =
    entity.class === EntityClass.Territory && !territoryParentId;

  const renderIcons = () => {
    if (!entity.isTemplate) {
      return (
        <FaPlayCircle
          color={theme.color["black"]}
          onClick={() => {
            // onPick nonTemplate entity
            onPick(entity);
          }}
          style={{ marginLeft: "0.5rem", cursor: "pointer" }}
        />
      );
    } else if (entity.isTemplate && !isInsideTemplate) {
      return (
        <>
          {!territoryWithoutParent && (
            <BiDuplicate
              color={theme.color["black"]}
              onClick={() => {
                // onPick template inside nonTemplate
                onPick(entity, true);
              }}
              style={{ marginLeft: "0.5rem", cursor: "pointer" }}
            />
          )}
        </>
      );
    } else if (entity.isTemplate && isInsideTemplate) {
      return (
        <div>
          {!territoryWithoutParent && (
            <BiDuplicate
              color={theme.color["black"]}
              onClick={() => {
                // onPick duplicate template to entity
                onPick(entity, true);
              }}
              style={{ marginLeft: "0.5rem", cursor: "pointer" }}
            />
          )}
          <ImInsertTemplate
            color={theme.color["black"]}
            onClick={() => {
              // onPick template entity
              onPick(entity);
            }}
            style={{ marginLeft: "0.5rem", cursor: "pointer" }}
          />
        </div>
      );
    }
  };

  const entityIsTemplate = entity.isTemplate || false;

  return (
    <StyledSuggestionRow
      key={index}
      style={style}
      twoIcons={entityIsTemplate && isInsideTemplate && !territoryWithoutParent}
    >
      <StyledSuggestionLineActions isSelected={selected === index}>
        {isNotDiscouraged && <>{renderIcons()}</>}
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
