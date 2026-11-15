import { useState } from "react";
import { EntitySuggestion } from "types";

/**
 * The rows a suggester lists: the priority rows, then the search hits not among
 * them. A priority row can leave the list at any time, but one arriving while
 * search hits sit under the open list waits until the hits go away or the list
 * opens again, so a late row never pushes a hit from under the cursor or moves
 * the row the arrow keys highlighted.
 */
export const useListedSuggestions = (
  prioritySuggestions: EntitySuggestion[],
  suggestions: EntitySuggestion[],
  isListOpen: boolean
): { listedSuggestions: EntitySuggestion[]; listedPriorityCount: number } => {
  // the priority rows the previous render listed
  const [listedIds, setListedIds] = useState<string[]>([]);
  const listedPriority =
    isListOpen && suggestions.length > 0
      ? prioritySuggestions.filter((s) => listedIds.includes(s.entity.id))
      : prioritySuggestions;
  const ids = listedPriority.map((s) => s.entity.id);
  if (ids.join() !== listedIds.join()) {
    setListedIds(ids);
  }

  return {
    listedSuggestions: [
      ...listedPriority,
      ...suggestions.filter((s) => !ids.includes(s.entity.id)),
    ],
    listedPriorityCount: listedPriority.length,
  };
};
