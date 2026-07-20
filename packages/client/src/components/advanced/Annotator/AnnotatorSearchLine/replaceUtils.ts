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
 * The occurrence to activate after the one at `currentIndex` was replaced and
 * removed from the list. Staying at the same index lands on what is now the
 * next occurrence; if the replaced one was last, step back.
 */
export const nextActiveOccurenceIndex = (currentIndex: number, remainingCount: number): number => {
  if (remainingCount === 0) {
    return 0;
  }
  return currentIndex >= remainingCount ? remainingCount - 1 : currentIndex;
};
