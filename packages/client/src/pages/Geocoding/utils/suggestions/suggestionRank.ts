/**
 * How a suggestion is drawn on the map: one mark, one size, for all of them.
 *
 * The number in it is the identification, and it is exact where a size ramp is
 * approximate — a reader comparing two discs is guessing at an order the label
 * already states. Sizing by rank also made the runner-up of two the faintest
 * mark on the scale, and every mark here is a place some gazetteer returned.
 */
export interface RankStyle {
  radius: number;
  weight: number;
  fillOpacity: number;
  opacity: number;
}

export const SUGGESTION_MARK: RankStyle = {
  radius: 10,
  // wide enough for the ring to carry a colour: at two pixels the score's step
  // is a hairline nobody reads, and the ring is where the score is said
  weight: 3,
  fillOpacity: 0.7,
  opacity: 1,
};

/**
 * How full a mark is drawn when the place falls outside the query's region.
 *
 * The fill, and only the fill: off-region is a claim about the query rather than
 * about the rank, so it takes the one channel the rank does not use. A hollow
 * mark reads as "counted, but not where you were looking" — which is what the
 * engine means by it, since it demotes these rather than hiding them.
 *
 * Shared by the map and the list so the same suggestion is the same mark in
 * both. A reader comparing a numbered disc on the map with a numbered disc
 * beside a card is comparing two drawings of one thing.
 */
export const OFF_REGION_FILL = 0.15;

/**
 * Whether the map should move, and what to remember once it has.
 *
 * The guard is here rather than in a dependency array because an array of two
 * numbers is a new value on every render: an effect keyed on the coordinate
 * itself would fly again on every keystroke elsewhere on the page, taking the
 * map back from a researcher who had panned away. Comparing the flattened key
 * against the last one flown says what actually changed.
 */
export const flightFor = (
  flown: string | null,
  leader: [number, number] | null,
): { key: string | null; fly: boolean } => {
  const key = leader ? `${leader[0]},${leader[1]}` : null;
  return { key, fly: !!leader && key !== flown };
};

/**
 * Above this the strongest suggestion is ahead of the second by enough to read
 * as the answer rather than as the first of several.
 *
 * The figure comes from the engine team's own auto-accept sketch, and every
 * constant in their scoring model is a hand-picked guess - which is why this
 * changes two words and never hides a runner-up.
 */
export const LEAD_IS_CLEAR = 0.2;

/**
 * How many suggestions the engine did not separate from its leader.
 *
 * `margin` is the relative gap between the top two; this applies the same
 * measure to every card rather than only the second, so it answers "how many of
 * these are tied" instead of "is the first ahead of the second".
 *
 * A tie is not a near-miss. Measured against the live engine, three suggestions
 * for `Newton` came back on identical scores and identical on every other
 * published field too - same source count, same context rating, same spread,
 * none off-region. Three English villages called Newton, each attested twice.
 * Drawing those as 100, 94 and 93 invites the eye to order three places the
 * engine did not order, over a difference in a number whose denominator moves
 * between queries.
 *
 * Measured against the top rather than chained from card to card: chained, a
 * long tail of near-equal small scores links end to end and swallows the list -
 * 188 of one query's suggestions, against 4 measured this way.
 */
export const bandOf = (
  response: { margin?: number | null; suggestions: { score: number }[] } | null,
): { size: number; clear: boolean } | null => {
  if (!response || response.margin == null || response.suggestions.length < 2) {
    return null;
  }
  const top = Math.max(...response.suggestions.map((one) => one.score));
  if (top <= 0) {
    return null;
  }
  const floor = top * (1 - LEAD_IS_CLEAR);
  const size = response.suggestions.filter((one) => one.score >= floor).length;
  return { size, clear: size === 1 };
};

/**
 * How far up the ramp one answer sits, 0 to 1.
 *
 * Measured against the best answer in the SAME response, because that is the
 * only comparison the engine's score supports. A score orders suggestions
 * within one query and means nothing between two: the engine asks a different
 * set of sources per query, so the denominator moves — and the context weights
 * move it further, since they decide both which sources are asked and how much
 * each counts. Measured on one `Breslau` query, the same correct answer scored
 * 0.7571 under the default weights and 0.5979 with region weighted double.
 * Painted on one fixed scale, that is the right answer going visibly pale
 * because a slider moved.
 *
 * A ratio to the leader rather than a position between two constants, and the
 * ratio is the engine's own unit: `margin` is `(top − second) / top`, so the
 * runner-up's share here is exactly `1 − margin`.
 *
 * What this gives up is a colour that says "this whole run is poor" — the
 * leader is painted at full strength in every run, including a bad one. That
 * signal is carried by the things that can carry it honestly: the off-region
 * mark, the band that says no answer was clear, and the printed score itself.
 */
export const scoreShare = (score: number, top: number): number => {
  if (!(top > 0)) {
    return 0;
  }
  return Math.max(0, Math.min(1, score / top));
};

/**
 * Which step of the five-colour ramp a share falls on.
 *
 * Shared by the list and the map, which is the whole point of it: a suggestion
 * drawn as a card and the same suggestion drawn as a mark carry one colour, so
 * a reader glancing between them is comparing two drawings of one thing rather
 * than reading two scales.
 */
export const scoreStep = (share: number): number =>
  Math.min(4, Math.max(0, Math.round(share * 4)));

/**
 * Whether a card in this position prints a score at all.
 *
 * Inside a band the panel draws no order in any channel. A flattened bar beside
 * an unflattened decimal is two marks saying "tied" against one saying "0.52
 * beats 0.44", and the one made of characters wins — a number is read without
 * being looked at. A band of one is a leader, and a leader has a score.
 */
export const showsScore = (band: { size: number; clear: boolean } | null, index: number) =>
  !band || band.clear || index >= band.size;
