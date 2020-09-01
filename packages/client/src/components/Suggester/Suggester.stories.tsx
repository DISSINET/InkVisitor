import React, { useState } from "react";
import { Suggester, Tag, Button } from "components";

import { Entities, EntityKeys } from "types";

import { storiesOf } from "@storybook/react";
import { withState } from "@dump247/storybook-state";

interface Suggestion {
  id: string;
  label: string;
  entityType: typeof Entities[EntityKeys];
}

interface State {
  typed: string;
  entityType: typeof Entities[EntityKeys];
  suggestions: Suggestion[];
}

const allSuggestion: Suggestion[] = [
  { entityType: Entities["P"], label: "David", id: "001" },
  { entityType: Entities["P"], label: "Petr", id: "002" },
  { entityType: Entities["P"], label: "Adam", id: "003" },
  { entityType: Entities["P"], label: "Tomáš", id: "004" },
  { entityType: Entities["L"], label: "Brno", id: "005" },
  { entityType: Entities["L"], label: "Praha", id: "006" },
  { entityType: Entities["L"], label: "Wien", id: "007" },
  { entityType: Entities["L"], label: "Wiener Neustadt", id: "008" },
  { entityType: Entities["L"], label: "Wiesbaden", id: "009" },
  { entityType: Entities["L"], label: "Wien, Hauptbahnhof", id: "010" },
];

const state: State = {
  typed: "",
  entityType: Entities["P"],
  suggestions: [],
};

const filterSuggestions = (
  entityType: typeof Entities[EntityKeys],
  typed: string
) => {
  return typed
    ? allSuggestion.filter((suggestion) => {
        return (
          suggestion.entityType.id === entityType.id &&
          suggestion.label.toLowerCase().includes(typed.toLowerCase())
        );
      })
    : [];
};

storiesOf("Suggester", module).add(
  "SimpleSuggester",
  withState(state)(({ store }) => {
    const { typed, entityType, suggestions } = store.state;
    return (
      <>
        <Suggester
          typed={typed}
          entityType={entityType}
          suggestions={suggestions}
          onType={(newTyped: string) => {
            store.set({
              typed: newTyped,
              suggestions: filterSuggestions(entityType, newTyped),
            });
          }}
          onChangeEntityType={(newEntityTypeId: keyof typeof Entities) => {
            const newEntityType = Entities[newEntityTypeId];
            store.set({
              entityType: newEntityType,
              suggestions: filterSuggestions(newEntityType, typed),
            });
          }}
          onPick={(suggestion: Suggestion) => {
            alert("suggestion " + suggestion.id + " picked");
          }}
          onCreate={(created: Suggestion) => {
            alert(
              "new node " +
                created.entityType +
                ": " +
                created.label +
                " created"
            );
          }}
        />
        <Tag
          entity={Entities["R"]}
          label="entity label"
          button={<Button label="x" color="danger" />}
        />
      </>
    );
  })
);
