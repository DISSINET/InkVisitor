import React from "react";
import { EngineMatch, MatchType } from "./engineTypes";
import { StyledMatchTag, StyledMatchTagName, StyledMatchTagSource } from "./MatchTagStyles";

/**
 * One match, as one tag: which gazetteer, and what it calls the place.
 *
 * Those two facts are what a match is. The third — how the source's name related
 * to the name searched for — is drawn rather than written, because its
 * vocabulary is the engine's own and needs a paragraph to explain: `alias` means
 * the source matched one of its indexed name forms while returning a different
 * label, and `fuzzy` means it cannot promise any exact form was involved. Both
 * are honest reports about the search rather than judgements of the place, and
 * spelled out on twenty tags they read as a verdict.
 */

/**
 * What each match type looks like, strongest first.
 *
 * One weight throughout: a thicker border reads as a heavier tag rather than a
 * better match, and next to a row of thin ones it pulls the eye for a reason
 * nobody can name. The line itself carries the distinction — continuous where
 * the name is the one searched for, broken as the claim weakens — and the
 * weakest is also faded, because the model's guess matched no record at all and
 * is the one thing here that is not a gazetteer saying something.
 */
const BORDER: Record<MatchType, { style: string; opacity: number }> = {
  exact: { style: "solid", opacity: 1 },
  alias: { style: "dashed", opacity: 1 },
  fuzzy: { style: "dotted", opacity: 1 },
  hint: { style: "dotted", opacity: 0.65 },
};

/** Words for the tooltip, where there is room to be exact about what it means. */
const EXPLAINS: Record<MatchType, string> = {
  exact: "the source's name for it is the name searched for",
  alias: "the source matched one of its own recorded name forms, and calls it this",
  fuzzy: "found by relevance, with no exact name form confirmed",
  hint: "the model's own coordinate guess, matched against no record",
};

interface MatchTag {
  match: EngineMatch;
}

export const MatchTag: React.FC<MatchTag> = ({ match }) => {
  const border = BORDER[match.matchType] || BORDER.fuzzy;
  const label = match.label?.trim() || "unnamed";
  return (
    <StyledMatchTag
      $source={match.source}
      $borderStyle={border.style}
      $faded={border.opacity < 1}
      title={`${match.source} · ${label}\n${EXPLAINS[match.matchType] || ""}\n${match.lat.toFixed(
        4,
      )}, ${match.lon.toFixed(4)}`}
    >
      <StyledMatchTagSource $source={match.source}>{match.source}</StyledMatchTagSource>
      <StyledMatchTagName>
        {match.sourceUrl ? (
          <a href={match.sourceUrl} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          label
        )}
      </StyledMatchTagName>
    </StyledMatchTag>
  );
};

export const __testing = { BORDER, EXPLAINS };
