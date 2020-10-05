import React, { useState } from "react";
import { Suggester, Tag, Button } from "components";
import { SuggestionI } from "./Suggester";

import { Entities, EntityKeys } from "types";

import { storiesOf } from "@storybook/react";
import { withState } from "@dump247/storybook-state";

interface State {
  typed: string;
  entityType: typeof Entities[EntityKeys];
  suggestions: SuggestionI[];
}

const allSuggestion: SuggestionI[] = [
  {
    color: Entities["P"].color,
    category: Entities["P"].id,
    label: "David",
    id: "001",
  },
  {
    color: Entities["P"].color,
    category: Entities["P"].id,
    label: "Petr",
    id: "002",
  },
  {
    color: Entities["P"].color,
    category: Entities["P"].id,
    label: "Adam",
    id: "003",
  },
  {
    color: Entities["P"].color,
    category: Entities["P"].id,
    label: "Tomáš",
    id: "004",
  },
  {
    color: Entities["P"].color,
    category: Entities["P"].id,
    label: "Brno",
    id: "005",
  },
  {
    color: Entities["L"].color,
    category: Entities["L"].id,
    label: "Praha",
    id: "006",
  },
  {
    color: Entities["L"].color,
    category: Entities["L"].id,
    label: "Wien",
    id: "007",
  },
  {
    color: Entities["L"].color,
    category: Entities["L"].id,
    label: "Wiener Neustadt",
    id: "008",
  },
  {
    color: Entities["L"].color,
    category: Entities["L"].id,
    label: "Wiesbaden",
    id: "009",
  },
  {
    color: Entities["L"].color,
    category: Entities["L"].id,
    label: "Wien, Hauptbahnhof",
    id: "010",
  },
  {
    color: Entities["E"].color,
    category: Entities["E"].id,
    label: "Festival ABC",
    id: "011",
  },
  {
    color: Entities["E"].color,
    category: Entities["E"].id,
    label: "Festival DEF",
    id: "012",
  },
  {
    color: Entities["E"].color,
    category: Entities["E"].id,
    label: "Festival GHI",
    id: "013",
  },
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
          suggestion.category === entityType.id &&
          suggestion.label.toLowerCase().includes(typed.toLowerCase())
        );
      })
    : [];
};

const categoriesOptions = Object.keys(Entities).map((ek) => ({
  value: Entities[ek].id,
  label: Entities[ek].label,
}));

storiesOf("Suggester", module).add(
  "SimpleSuggester",
  withState(state)(({ store }) => {
    const { typed, entityType, suggestions } = store.state;
    return (
      <>
        <Suggester
          typed={typed}
          placeholder="find a person, location or an event"
          category={entityType.id}
          categories={categoriesOptions}
          suggestions={suggestions}
          onType={(newTyped: string) => {
            store.set({
              typed: newTyped,
              suggestions: filterSuggestions(entityType, newTyped),
            });
          }}
          onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
            const newEntityType = Entities[newEntityTypeId];
            store.set({
              entityType: newEntityType,
              suggestions: filterSuggestions(newEntityType, typed),
            });
          }}
          onPick={(suggestion: SuggestionI) => {
            alert("suggestion " + suggestion.id + " picked");
          }}
          onCreate={(created: SuggestionI) => {
            alert(
              "new node " + created.category + ": " + created.label + " created"
            );
          }}
        />
      </>
    );
  })
);

storiesOf("Suggester", module).add(
  "Categories",
  withState(state)(({ store }) => {
    const { typed, entityType, suggestions } = store.state;
    return (
      <>
        <Suggester
          typed={typed}
          placeholder="find a person, location or an event"
          category={entityType.id}
          categories={categoriesOptions}
          suggestions={suggestions}
          onType={(newTyped: string) => {
            store.set({
              typed: newTyped,
              suggestions: filterSuggestions(entityType, newTyped),
            });
          }}
          onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
            const newEntityType = Entities[newEntityTypeId];
            store.set({
              entityType: newEntityType,
              suggestions: filterSuggestions(newEntityType, typed),
            });
          }}
          onPick={(suggestion: SuggestionI) => {
            alert("suggestion " + suggestion.id + " picked");
          }}
          onCreate={(created: SuggestionI) => {
            alert(
              "new node " + created.category + ": " + created.label + " created"
            );
          }}
        />
      </>
    );
  })
);
