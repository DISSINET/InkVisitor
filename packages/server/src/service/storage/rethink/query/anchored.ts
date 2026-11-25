import { EntityEnums } from "@inkvisitor/shared/enums";

/**
 * One anchor of a document: the entity, its class, and where the opening tag
 * starts and the closing tag ends in the content. An anchor stored without a
 * field holds null there, and a tag that never closes ends at -1.
 */
export type AnchorSpot = [
  anchor: string | null,
  anchorClass: string | null,
  indexStart: number | null,
  indexEnd: number | null,
];

/**
 * Ids of the entities anchored inside the span of a territory anchor.
 * `documents` holds the anchors of one document each. With `territoryIds` only
 * the spans of those territories count, null counts the span of every
 * territory.
 *
 * An anchor lies in a span when its opening tag does. The stored tree nests an
 * anchor under everything open where it starts, so this lists the same anchors
 * as walking down from the territory's node and leaving out what starts after
 * its span ends, which is how the PostgreSQL predicate reads the tree. An
 * anchor crossing the end of a span is listed, the anchors after the span are
 * not. A territory tag that never closes spans nothing, and an anchor without
 * positions neither spans nor is listed.
 */
export function anchoredUnder(documents: AnchorSpot[][], territoryIds: string[] | null): string[] {
  const targets = territoryIds && new Set(territoryIds);
  const anchored = new Set<string>();
  for (const spots of documents) {
    const inTextOrder = spots
      .filter((spot): spot is [string, string | null, number, number | null] => {
        return typeof spot[0] === "string" && typeof spot[2] === "number";
      })
      .sort((a, b) => a[2] - b[2]);
    // the furthest end among the spans opened so far, -1 while none is
    let reach = -1;
    for (const [anchor, anchorClass, start, end] of inTextOrder) {
      if (start < reach) {
        anchored.add(anchor);
      }
      const opensSpan = anchorClass === EntityEnums.Class.Territory && (!targets || targets.has(anchor));
      if (opensSpan && typeof end === "number") {
        reach = Math.max(reach, end);
      }
    }
  }
  return [...anchored];
}
