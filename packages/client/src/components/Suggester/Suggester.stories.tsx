import React, { useState } from "react";
import { Suggester, Tag, Button } from "components";
import { Entities, EntityKeys } from "types";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { withReactContext } from "storybook-react-context";

import { SuggestionI } from "./Suggester";

export default {
  title: "Suggester",
  decorators: [withReactContext],
  parameters: {
    info: { inline: true },
    initialState: {
      typed: "",
      entityType: Entities["P"],
      suggestions: [],
    },
  },
};

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

export const SimpleSuggester = (
  _: any,
  { context: [state, dispatch] }: any
) => {
  const { typed, entityType, suggestions } = state;
  return (
    <DndProvider backend={HTML5Backend}>
      <Suggester
        typed={typed}
        placeholder="find a person, location or an event"
        category={entityType.id}
        categories={categoriesOptions}
        suggestions={suggestions}
        onType={(newTyped: string) => {
          dispatch({
            typed: newTyped,
            suggestions: filterSuggestions(entityType, newTyped),
          });
        }}
        onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
          const newEntityType = Entities[newEntityTypeId];
          dispatch({
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
        onDrop={(item: {}) => {}}
      />
    </DndProvider>
  );
};

export const SuggesterCategoriesMarginTop = (
  _: any,
  { context: [state, dispatch] }: any
) => {
  const { typed, entityType, suggestions } = state;
  return (
    <DndProvider backend={HTML5Backend}>
      <Suggester
        marginTop
        typed={typed}
        placeholder="find a person, location or an event"
        category={entityType.id}
        categories={categoriesOptions}
        suggestions={suggestions}
        onType={(newTyped: string) => {
          dispatch({
            typed: newTyped,
            suggestions: filterSuggestions(entityType, newTyped),
          });
        }}
        onChangeCategory={(newEntityTypeId: keyof typeof Entities) => {
          const newEntityType = Entities[newEntityTypeId];
          dispatch({
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
        onDrop={(item: {}) => {}}
      />
    </DndProvider>
  );
};
