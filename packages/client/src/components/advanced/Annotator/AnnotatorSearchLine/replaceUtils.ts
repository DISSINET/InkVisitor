/** Absolute character range in the document text, end-exclusive. */
export interface ReplaceRange {
  startIndex: number;
  endIndex: number;
}

/**
 * Applies the same replacement string to every range of `text`. Ranges are
 * processed from the end backwards so earlier ranges keep their original
 * indices no matter how the replacement changes the length. Ranges that are
 * inverted or out of bounds are skipped.
 */
export const applyReplacements = (
  text: string,
  ranges: ReplaceRange[],
  replaceWith: string,
): string => {
  const sorted = [...ranges].sort((a, b) => b.endIndex - a.endIndex);

  let newText = text;
  for (const { startIndex, endIndex } of sorted) {
    if (startIndex >= 0 && endIndex >= startIndex && endIndex <= newText.length) {
      newText = newText.slice(0, startIndex) + replaceWith + newText.slice(endIndex);
    }
  }
  return newText;
};

/**
 * The active occurrence index for a freshly searched list. A search rerun over
 * edited text can return fewer occurrences than the caller is parked on, and an
 * index past the end addresses nothing.
 */
export const clampActiveOccurenceIndex = (
  activeIndex: number,
  occurenceCount: number,
): number => {
  if (occurenceCount === 0) {
    return 0;
  }
  return Math.min(activeIndex, occurenceCount - 1);
};

/**
 * The occurrence to activate after a replace, given every occurrence's start
 * index in the searched text and `resumeFrom`, the index just past the inserted
 * text. Picks the first match beyond the replacement, so a replacement that
 * still matches the term is stepped over rather than revisited. Wraps to the
 * first occurrence when nothing follows the replaced spot.
 */
export const nextOccurenceIndexAfter = (
  occurenceStartIndices: number[],
  resumeFrom: number,
): number => {
  const next = occurenceStartIndices.findIndex(
    (startIndex) => startIndex >= resumeFrom,
  );
  return next === -1 ? 0 : next;
};
