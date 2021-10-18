import React, { useState } from "react";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { FaPlus, FaPlayCircle } from "react-icons/fa";
import { MdCancel } from "react-icons/md";

import { Button, Input, Loader, Tag } from "components";
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
  StyledRelativePosition,
  StyledTypeBar,
} from "./SuggesterStyles";

export interface SuggestionI {
  id: string;
  label: string;
  detail: string;
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
  allowDrop?: boolean;
  isFetching?: boolean;

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
  allowDrop = false,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
  onCancel = () => {},
  isFetching,
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
  const [highlighted, setHighlighted] = useState();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <StyledSuggester marginTop={marginTop}>
      <StyledInputWrapper ref={dropRef} hasButton={allowCreate} isOver={isOver}>
        <StyledTypeBar title={`entity${category}`}></StyledTypeBar>
        <Input
          type="select"
          value={category}
          options={categories}
          inverted
          suggester
          onChangeFn={onChangeCategory}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <Input
          type="text"
          value={typed}
          onChangeFn={onType}
          placeholder={placeholder}
          suggester
          changeOnType={true}
          width={inputWidth}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
      {isFocused && (suggestions.length || isFetching) ? (
        <StyledSuggesterList>
          <StyledRelativePosition>
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
                      tooltipDetail={suggestion.detail}
                      category={suggestion.category}
                    />
                  </StyledSuggestionLineTag>
                  <StyledSuggestionLineIcons>
                    {suggestion.icons}
                  </StyledSuggestionLineIcons>
                </React.Fragment>
              ))}
            <Loader size={30} show={isFetching} />
          </StyledRelativePosition>
        </StyledSuggesterList>
      ) : null}
    </StyledSuggester>
  );
};
