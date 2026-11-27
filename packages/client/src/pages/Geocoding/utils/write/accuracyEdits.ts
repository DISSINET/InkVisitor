import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";

/**
 * The edits the settings table makes to the project's accuracies, pure so the
 * rules can be tested without rendering the table.
 *
 * A mark names a Concept of the list, so a mark on a Concept that leaves the
 * list leaves with it: no mark names an accuracy nothing offers.
 */

export type AccuracyList = Pick<
  IGeocodingRoles,
  "accuracies" | "accuracyWhenAgree" | "accuracyWhenScattered"
>;

/** Drops the marks that name a Concept no longer in the list. */
const keepMarks = (next: AccuracyList): AccuracyList => ({
  ...next,
  accuracyWhenAgree: next.accuracies.includes(next.accuracyWhenAgree) ? next.accuracyWhenAgree : "",
  accuracyWhenScattered: next.accuracies.includes(next.accuracyWhenScattered)
    ? next.accuracyWhenScattered
    : "",
});

/** An empty row at the end, to be given a Concept. */
export const addAccuracy = (list: AccuracyList): AccuracyList => ({
  ...list,
  accuracies: [...list.accuracies, ""],
});

/** Gives the row at `index` a Concept, or takes it away where null. */
export const setAccuracyConcept = (
  list: AccuracyList,
  index: number,
  conceptId: string | null,
): AccuracyList =>
  keepMarks({
    ...list,
    accuracies: list.accuracies.map((one, at) => (at === index ? (conceptId ?? "") : one)),
  });

export const removeAccuracy = (list: AccuracyList, index: number): AccuracyList =>
  keepMarks({ ...list, accuracies: list.accuracies.filter((_, at) => at !== index) });

/** Moves the row at `index` one place up (-1) or down (1); a row at the edge stays. */
export const moveAccuracy = (list: AccuracyList, index: number, by: -1 | 1): AccuracyList => {
  const to = index + by;
  if (to < 0 || to >= list.accuracies.length) {
    return list;
  }
  const accuracies = [...list.accuracies];
  [accuracies[index], accuracies[to]] = [accuracies[to], accuracies[index]];
  return { ...list, accuracies };
};

/** Marks a Concept as the accuracy for sources that agree, or for scattered ones; "" clears the mark. */
export const markAccuracy = (
  list: AccuracyList,
  mark: "accuracyWhenAgree" | "accuracyWhenScattered",
  conceptId: string,
): AccuracyList => keepMarks({ ...list, [mark]: conceptId });

/** A Concept listed twice, which Save refuses: the list is of choices, and one choice twice is a mistake. */
export const repeatedAccuracy = (list: AccuracyList): string | undefined =>
  list.accuracies.filter(Boolean).find((id, at, all) => all.indexOf(id) !== at);

/** The list as it is stored: without the rows that were never given a Concept. */
export const accuraciesToSave = (list: AccuracyList): AccuracyList =>
  keepMarks({ ...list, accuracies: list.accuracies.filter(Boolean) });
