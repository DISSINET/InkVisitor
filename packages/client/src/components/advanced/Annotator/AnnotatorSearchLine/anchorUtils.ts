/**
 * Picked entity ids that the active match does not carry yet.
 *
 * The order of `pickedIds` is preserved because each anchor nests inside the
 * previous one, so the first id returned becomes the outermost tag.
 *
 * @param pickedIds entity ids selected in the sequential anchoring panel
 * @param anchoredTagNames tag names of the anchors already on the active match
 */
export const entityIdsToAnchor = (pickedIds: string[], anchoredTagNames: string[]): string[] => {
  const anchored = new Set(anchoredTagNames);
  return pickedIds.filter((id) => !anchored.has(id));
};
