import { quotesToPattern } from "@inkvisitor/shared/constants";
import { IEntity } from "@inkvisitor/shared/types";
import { foldText } from "components/basic/BaseDropdown/dropdownLogic";

const REGEX_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Builds the test the entity suggester runs on the server for typed text: a
 * match at the start of any word of any label (alternative labels included),
 * open at the end, each typed word in order with other words allowed between
 * them, or a UUID prefix. A leading `*` lifts the word-start anchor. Quote marks
 * and apostrophes are interchangeable.
 * @returns undefined when no text is left to match, so every template passes
 */
export const templateMatcher = (search: string): ((template: IEntity) => boolean) | undefined => {
  const typed = search.trim().replace(/\s+/g, " ");
  const anywhere = typed.startsWith("*");
  const text = foldText(anywhere ? typed.slice(1) : typed).trim();
  if (!text) {
    return undefined;
  }
  // the glue between words keeps word and separator classes disjoint, so a
  // label that fails to match can not backtrack exponentially
  const body = quotesToPattern(text.replace(REGEX_CHARS, "\\$&"))
    .split(" ")
    .join("[^a-z0-9]+([a-z0-9]+[^a-z0-9]+)*");
  const pattern = new RegExp(`${anywhere ? "" : "(^|[^a-z0-9])"}${body}`);
  return (template) =>
    template.id.startsWith(typed) || template.labels.some((label) => pattern.test(foldText(label)));
};
