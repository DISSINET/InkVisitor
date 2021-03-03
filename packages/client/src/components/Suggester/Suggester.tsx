import React from "react";
import classNames from "classnames";
import { useDrop } from "react-dnd";
import { FaPlus } from "react-icons/fa";

import { Button, Input, Tag } from "components";
import { OptionI } from "@shared/types";
import { ItemTypes } from "types";
import {
  StyledSuggester,
  InputWrapper,
  SuggesterButton,
  SuggesterList,
  SuggestionLine,
} from "./SuggesterStyles";

export interface SuggestionI {
  id: string;
  label: string;
  category: string;
  color: string;
}

interface SuggesterProps {
  marginTop?: boolean;
  suggestions: SuggestionI[];
  placeholder?: string; // text to display when typed === ""
  typed: string; // input value
  category: string; // selected category
  categories: OptionI[]; // all possible categories
  suggestionListPosition?: string; // todo not implemented yet
  disabled?: boolean; // todo not implemented yet

  // events
  onType: Function;
  onChangeCategory: Function;
  onCreate: Function;
  onPick: Function;
  onDrop: Function;
}

const MAXSUGGESTIONDISPLAYED = 10;

export const Suggester: React.FC<SuggesterProps> = ({
  marginTop,
  suggestions = [],
  placeholder,
  typed,
  category,
  categories,
  suggestionListPosition,
  disabled,

  // events
  onType,
  onChangeCategory,
  onCreate,
  onPick,
  onDrop,
}) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: ItemTypes.TAG,
    drop: (item) => {
      onDrop(item);
      console.log(item);
    },
    collect: (monitor) => ({
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
        <SuggesterList className={classNames("bg-opacity-75")}>
          {suggestions
            .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
            .map((suggestion, si) => (
              <SuggestionLine key={si}>
                <Tag
                  propId={suggestion.id}
                  label={suggestion.label}
                  category={suggestion.category}
                  color={suggestion.color}
                  button={
                    <Button
                      label=">"
                      color="primary"
                      onClick={() => {
                        onPick(suggestion);
                      }}
                    />
                  }
                />
              </SuggestionLine>
            ))}
        </SuggesterList>
      ) : null}
    </StyledSuggester>
  );
};
