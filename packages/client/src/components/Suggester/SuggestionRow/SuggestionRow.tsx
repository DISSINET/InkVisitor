import { EntityStatus } from "@shared/enums";
import { Tag } from "components/Tag/Tag";
import memoize from "memoize-one";
import React from "react";
import { FaPlayCircle } from "react-icons/fa";
import theme from "Theme/theme";
import { EntitySuggestionI, UserSuggestionI } from "../Suggester";
import {
  StyledSuggestionLineActions,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledSuggestionRow,
  StyledTagWrapper,
} from "../SuggesterStyles";
import { areEqual } from "react-window";

export const createItemData = memoize(
  (
    items: EntitySuggestionI[] | UserSuggestionI[],
    onPick: Function,
    selected: number
  ) => ({
    items,
    onPick,
    selected,
  })
);

export type EntityItemData = {
  items: EntitySuggestionI[];
  onPick: Function;
  selected: number;
};

interface EntityRow {
  data: EntityItemData;
  index: number;
  style: any;
}
const EntityRow: React.FC<EntityRow> = ({ data, index, style }) => {
  const { items, onPick, selected } = data;
  const suggestion = items[index];

  return (
    <StyledSuggestionRow key={index} style={style}>
      <StyledSuggestionLineActions isSelected={selected === index}>
        {suggestion.status !== EntityStatus.Discouraged && (
          <FaPlayCircle
            color={theme.color["black"]}
            onClick={() => {
              onPick(suggestion);
            }}
          />
        )}
      </StyledSuggestionLineActions>
      <StyledSuggestionLineTag isSelected={selected === index}>
        <StyledTagWrapper>
          <Tag
            fullWidth
            propId={suggestion.id}
            label={suggestion.label}
            status={suggestion.status}
            ltype={suggestion.ltype}
            tooltipDetail={suggestion.detail}
            category={suggestion.category}
            isTemplate={suggestion.isTemplate}
          />
        </StyledTagWrapper>
      </StyledSuggestionLineTag>
      <StyledSuggestionLineIcons isSelected={selected === index}>
        {suggestion.icons}
      </StyledSuggestionLineIcons>
    </StyledSuggestionRow>
  );
};

export const MemoizedEntityRow = React.memo(EntityRow, areEqual);

export type UserItemData = {
  items: UserSuggestionI[];
  onPick: Function;
  selected: number;
};

interface UserRow {
  data: UserItemData;
  index: number;
  style: any;
}
const UserRow: React.FC<UserRow> = ({ data, index, style }) => {
  const { items, onPick, selected } = data;
  const suggestion = items[index];

  return (
    <StyledSuggestionRow key={index} style={style}>
      <StyledSuggestionLineActions isSelected={selected === index}>
        <FaPlayCircle
          color={theme.color["black"]}
          onClick={() => {
            onPick(suggestion);
          }}
        />
      </StyledSuggestionLineActions>
      <StyledSuggestionLineTag isSelected={selected === index}>
        <StyledTagWrapper>
          <Tag
            fullWidth
            propId={suggestion.id}
            label={suggestion.label}
            category={"U"}
          />
        </StyledTagWrapper>
      </StyledSuggestionLineTag>
      <StyledSuggestionLineIcons isSelected={selected === index}>
        {suggestion.icons}
      </StyledSuggestionLineIcons>
    </StyledSuggestionRow>
  );
};

export const MemoizedUserRow = React.memo(UserRow, areEqual);
