import { foldQuotes } from "@inkvisitor/shared/constants";
import { IEntity } from "@inkvisitor/shared/types";
import { foldText } from "components/basic/BaseDropdown/dropdownLogic";
import { createContext } from "react";

/**
 * The entities anchored in the text around the statement open in the Editor,
 * closest first (IResponseStatement.anchoredNearby). Every suggester under the
 * provider lists the ones it accepts above its search hits.
 */
export const AnchoredNearbyContext = createContext<IEntity[] | undefined>(undefined);

const fold = (text: string) => foldQuotes(foldText(text));

/**
 * The anchored entities a suggester lists for the typed text: all of them on an
 * empty input, then those with a label holding every typed word. Accents,
 * quote marks and a `*` wildcard are ignored, close to how label search
 * treats them, though a word matches anywhere in a label, not only at a word
 * start.
 */
export const anchoredMatchingTyped = (anchored: IEntity[], typed: string): IEntity[] => {
  const words = fold(typed.replace(/\*/g, " ")).split(/\s+/).filter(Boolean);
  return words.length
    ? anchored.filter((entity) =>
        (entity.labels ?? []).some(
          (label) =>
            typeof label === "string" && words.every((word) => fold(label).includes(word))
        )
      )
    : anchored;
};
