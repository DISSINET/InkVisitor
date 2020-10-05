import React, { ReactNode, MouseEventHandler } from "react";

import classNames from "classnames";
import { Button, Input, Tag } from "components";
import { OptionI } from "@shared/types";

export interface SuggestionI {
  id: string;
  label: string;
  category: string;
  color: string;
}

interface SuggesterProps {
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
  onDrop?: Function;
}

export const Suggester: React.FC<SuggesterProps> = ({
  suggestions,
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
  return (
    <div className={classNames("suggestor", "component", "inline-flex")}>
      <div className={classNames("suggestor-input", "inline-flex")}>
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
        <Button
          label="+"
          onClick={() => {
            onCreate({
              label: typed,
              category: category,
            });
          }}
        />
      </div>
      {suggestions.length ? (
        <div
          className={classNames(
            "suggestor-list",
            "bg-grey",
            "absolute",
            "p-1",
            "w-auto"
          )}
          style={{ top: "36px", left: "47px" }}
        >
          {suggestions.map((suggestion, si) => (
            <div
              className={classNames("suggestion-line", "block", "p-1")}
              key={si}
            >
              <Tag
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
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

Suggester.defaultProps = {
  suggestions: [],
};
