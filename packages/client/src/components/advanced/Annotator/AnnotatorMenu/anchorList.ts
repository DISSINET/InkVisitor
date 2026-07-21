import { Tag } from "@inkvisitor/annotator/src/lib";
import { IEntity } from "@inkvisitor/shared/types";
import { AnnotatorAnchorListItem } from "./AnnotatorMenuAnchorListRow";

/**
 * Whether any anchor is missing its elvl attribute. Anchors written before elvl
 * existed carry no value at all, so the empty string counts as missing too.
 */
export const hasAnchorsWithoutElvl = (anchors: Tag[]): boolean =>
  anchors.some(
    (anchor) =>
      anchor.attributes.elvl === undefined ||
      anchor.attributes.elvl === null ||
      anchor.attributes.elvl === "",
  );

/**
 * Pairs each anchor with its tag name (mostly UUID), keeping only those whose entity is
 * loaded — an entry is `false` while its fetch is still pending, and a row has
 * nothing to render until the entity arrives.
 */
export const resolveAnchors = (
  anchors: Tag[],
  entities: Record<string, IEntity | false>,
): AnnotatorAnchorListItem[] => {
  const out: AnnotatorAnchorListItem[] = [];
  for (const anchor of anchors) {
    const anchorTagName = anchor.getTagName();
    if (entities[anchorTagName]) {
      out.push({ anchor, anchorTagName });
    }
  }
  return out;
};
