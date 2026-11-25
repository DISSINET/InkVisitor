import { useState } from "react";
import { EntitySuggestion } from "types";

/**
 * The rows a suggester lists: the priority rows, then the search hits not among
 * them. A priority row can leave the list at any time, but one arriving while
 * search hits sit under the open list waits until the hits go away or the list
 * opens again, so a late row never pushes a hit from under the cursor or moves
 * the row the arrow keys highlighted. `search` names what the user searches for
 * (the typed text and the class); the rows that come with a new search are
 * listed at once. The search changes on the keystroke while the hits follow a
 * debounced request, so for that moment the new rows sit above the previous
 * hits.
 */
export const useListedSuggestions = (
  prioritySuggestions: EntitySuggestion[],
  suggestions: EntitySuggestion[],
  isListOpen: boolean,
  search = ""
): { listedSuggestions: EntitySuggestion[]; listedPriorityCount: number } => {
  // the priority rows the previous render listed, and the search it listed them for
  const [listed, setListed] = useState<{ ids: string[]; search: string }>({ ids: [], search });
  const listedPriority =
    isListOpen && suggestions.length > 0 && listed.search === search
      ? prioritySuggestions.filter((s) => listed.ids.includes(s.entity.id))
      : prioritySuggestions;
  const ids = listedPriority.map((s) => s.entity.id);
  if (ids.join() !== listed.ids.join() || listed.search !== search) {
    setListed({ ids, search });
  }

  return {
    listedSuggestions: [
      ...listedPriority,
      ...suggestions.filter((s) => !ids.includes(s.entity.id)),
    ],
    listedPriorityCount: listedPriority.length,
  };
};
