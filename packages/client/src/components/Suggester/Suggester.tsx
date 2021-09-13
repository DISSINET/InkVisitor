import React, { ReactElement, useEffect } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus, FaPlayCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

import { Button, Input, Tag } from "components";
import { IOption } from "@shared/types";
import { ItemTypes } from "types";
import {
  StyledSuggester,
  StyledInputWrapper,
  StyledSuggesterButton,
  StyledSuggesterList,
  StyledSuggestionLineIcons,
  StyledSuggestionLineTag,
  StyledSuggestionLineActions,
  StyledSuggestionCancelButton,
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
  displayCancelButton?: boolean;
  allowCreate?: boolean;

  // events
  onType: Function;
  onChangeCategory: Function;
  onCreate: Function;
  onPick: Function;
  onDrop: Function;
  onCancel?: Function;
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
  displayCancelButton = false,
  allowCreate = true,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
  onCancel = () => {},
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
      <StyledInputWrapper ref={dropRef} hasButton={allowCreate} isOver={isOver}>
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
          onEnterPressFn={() => {
            onCreate({
              label: typed,
              category: category,
            });
          }}
        />
        {displayCancelButton && (
          <StyledSuggestionCancelButton>
            <MdCancel onClick={() => onCancel()} />
          </StyledSuggestionCancelButton>
        )}

        {allowCreate && (
          <StyledSuggesterButton>
            <Button
              icon={<FaPlus style={{ fontSize: "16px", padding: "2px" }} />}
              tooltip="create new actant"
              color="primary"
              onClick={() => {
                onCreate({
                  label: typed,
                  category: category,
                });
              }}
            />
          </StyledSuggesterButton>
        )}
      </StyledInputWrapper>
      {suggestions.length ? (
        <StyledSuggesterList>
          {suggestions
            .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
            .map((suggestion, si) => (
              <React.Fragment key={si}>
                <StyledSuggestionLineActions>
                  <FaPlayCircle
                    onClick={() => {
                      onPick(suggestion);
                    }}
                  />
                </StyledSuggestionLineActions>
                <StyledSuggestionLineTag>
                  <Tag
                    propId={suggestion.id}
                    label={suggestion.label}
                    category={suggestion.category}
                    color={suggestion.color}
                  />
                </StyledSuggestionLineTag>
                <StyledSuggestionLineIcons>
                  {suggestion.icons}
                </StyledSuggestionLineIcons>
              </React.Fragment>
            ))}
        </StyledSuggesterList>
      ) : null}
    </StyledSuggester>
  );
};
