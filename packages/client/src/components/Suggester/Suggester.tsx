import React, { ReactNode, MouseEventHandler } from "react";
import classNames from "classnames";
import { useDrop } from "react-dnd";

import { Button, Input, Tag } from "components";
import { OptionI } from "@shared/types";
import { ItemTypes } from "types";

import { FaPlus } from "react-icons/fa";

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
  onDrop: Function;
}

const MAXSUGGESTIONDISPLAYED = 10;

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
    <div
      className={classNames(
        "suggestor",
        "component",
        "relative",
        isOver && "opacity-75"
      )}
    >
      <div
        ref={dropRef}
        className={classNames("suggestor-input", "inline-flex")}
      >
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
        <div className="suggester-button mt-2">
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
        </div>
      </div>
      {suggestions.length ? (
        <div
          className={classNames(
            "suggestor-list",
            "bg-grey",
            "absolute",
            "bg-opacity-75",
            "p-1",
            "w-auto",
            "z-10"
          )}
          style={{}}
        >
          {suggestions
            .filter((s, si) => si < MAXSUGGESTIONDISPLAYED)
            .map((suggestion, si) => (
              <div
                className={classNames("suggestion-line", "block", "p-1")}
                key={si}
              >
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
