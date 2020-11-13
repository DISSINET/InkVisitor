import React, { useState } from "react";
import { Tag, Button, Input, Suggester, DropDown } from "components";
import { Entities } from "types";
import { SuggestionI } from "components/Suggester/Suggester";

import { ActantI } from "@shared/types";

import { getActants } from "api/getActants";

interface ActantSuggester {
  entityIds: readonly string[];
  onPick: Function;
  onDrop: Function;
  onCreate: Function;
}

export interface DropItemI {
  id: string;
  type: string;
  category: string;
}

const MINLENGTHOFTYPEDTOSUGGEST = 2;
export const ActantSuggester: React.FC<ActantSuggester> = ({
  entityIds,
  onPick,
  onDrop,
  onCreate,
}) => {
  const [typed, setTyped] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [entity, setEntity] = useState(entityIds[0]);

  return (
    <Suggester
      suggestions={suggestions}
      typed={typed}
      category={entity}
      categories={entityIds.map((i) => ({ value: i, label: i }))}
      onType={async (newTyped: string) => {
        setTyped(newTyped);
        if (newTyped.length > MINLENGTHOFTYPEDTOSUGGEST) {
          const suggestedActants = await getActants(entity, newTyped);
          setSuggestions(
            suggestedActants.map((a: ActantI) => ({
              id: a.id,
              label: a.data.label,
              category: entity,
              color: Entities[entity].color,
            }))
          );
        } else {
          setSuggestions([]);
        }
      }}
      onChangeCategory={(newEntityTypeId: string) => {
        setEntity(newEntityTypeId);
      }}
      onCreate={() => {
        onCreate(entity, typed);
      }}
      onPick={(created: SuggestionI) => {
        onPick(created);
      }}
      onDrop={(item: DropItemI) => {
        onDrop(item);
      }}
    />
  );
};
