import React, { ReactNode, MouseEventHandler } from "react";

import classNames from "classnames";
import { Button, Input, Tag } from "components";
import { EntityKeys, Entities } from "types";

interface Suggestion {
  id: string;
  label: string;
  entityType: typeof Entities[EntityKeys];
}

interface SuggesterProps {
  suggestions: Suggestion[];
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
  onPick,
  onCreate,
}) => {
  const entityKeys = Object.keys(Entities);

  return (
    <div className={classNames("suggestor", "component")}>
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
            "p-2",
            "w-auto"
          )}
          style={{}}
        >
          {suggestions.map((suggestion, si) => (
            <div className={classNames("block", "p-1")} key={si}>
              <Tag
                label={suggestion.label}
                entity={suggestion.entityType}
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
