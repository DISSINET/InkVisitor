import React, { ReactElement } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus, FaPlayCircle } from "react-icons/fa";

import { Button, Input, Tag } from "components";
import { IOption } from "@shared/types";
import { ItemTypes } from "types";
import {
  StyledSuggester,
  InputWrapper,
  SuggesterButton,
  SuggesterList,
  SuggestionLineIcons,
  SuggestionLineTag,
  SuggestionLineActions,
} from "./SuggesterStyles";

export interface SuggestionI {
  id: string;
  label: string;
  category: string;
  color: string;
  icons?: React.ReactNode[];
}

interface SuggesterProps {
  marginTop?: boolean;
  suggestions: SuggestionI[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: string; // selected category
  categories: IOption[]; // all possible categories
  suggestionListPosition?: string; // todo not implemented yet
  disabled?: boolean; // todo not implemented yet
  inputWidth?: number;

  // events
  onType: Function;
  onChangeCategory: Function;
  onCreate: Function;
  onPick: Function;
  onDrop: Function;
  cleanOnSelect?: boolean;
}

const MAXSUGGESTIONDISPLAYED = 10;

export const Suggester: React.FC<SuggesterProps> = ({
  marginTop,
  suggestions = [],
  placeholder = "",
  typed,
  category,
  categories,
  suggestionListPosition,
  disabled,
  inputWidth = 100,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item: DragObjectWithType) => {
      onDrop(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <StyledSuggester marginTop={marginTop}>
      <InputWrapper ref={dropRef} isOver={isOver}>
        <Input
          type="select"
          value={category}
          options={categories}
          inverted
          onChangeFn={onChangeCategory}
        />
        <Input
          type="text"
          value={typed}
          onChangeFn={onType}
          placeholder={placeholder}
          changeOnType={true}
          width={inputWidth}
        />
        <SuggesterButton>
          <Button
            icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
            color="primary"
            onClick={() => {
              onCreate({
                label: typed,
                category: category,
              });
            }}
          />
        </SuggesterButton>
      </InputWrapper>
      {suggestions.length ? (
        <SuggesterList>
          {suggestions
            .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
            .map((suggestion, si) => (
              <React.Fragment key={si}>
                <SuggestionLineActions>
                  <FaPlayCircle
                    onClick={() => {
                      onPick(suggestion);
                    }}
                  />
                </SuggestionLineActions>
                <SuggestionLineTag>
                  <Tag
                    propId={suggestion.id}
                    label={suggestion.label}
                    category={suggestion.category}
                    color={suggestion.color}
                  />
                </SuggestionLineTag>
                <SuggestionLineIcons>{suggestion.icons}</SuggestionLineIcons>
              </React.Fragment>
            ))}
        </SuggesterList>
      ) : null}
    </StyledSuggester>
  );
};
