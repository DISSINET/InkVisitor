import React, { ReactNode, MouseEventHandler } from "react";

import classNames from "classnames";
import { Button, Input, Tag } from "components";
import { EntityKeys, Entities } from "types";

export interface SuggestionI {
  id: string;
  label: string;
  category: string;
  color: string;
}

interface SuggesterProps {
  suggestions: SuggestionI[];
  typed: string;
  entityType: typeof Entities[EntityKeys];
  onType: Function;
  onChangeEntityType: Function;
  onCreate: Function;
  onPick: Function;
}

export const Suggester: React.FC<SuggesterProps> = ({
  suggestions,
  typed,
  entityType,
  onChangeEntityType,
  onType,
  onCreate,
  onPick,
}) => {
  const entityKeys = Object.keys(Entities);

  return (
    <div className={classNames("suggestor", "component", "inline-flex")}>
      <div className={classNames("suggestor-input", "inline-flex")}>
        <Input
          type="select"
          value={entityType.id}
          options={entityKeys}
          inverted
          onChangeFn={onChangeEntityType}
        />
        <Input type="text" value={typed} onChangeFn={onType} />
        <Button
          label="+"
          onClick={() => {
            onCreate({
              label: typed,
              entityType: entityType,
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
