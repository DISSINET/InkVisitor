import React from "react";
import { Suggestion } from "./engineTypes";
import { splitLabel } from "./suggestionLabel";
import { scoreShare } from "./suggestionRank";
import { StyledScoreBar, StyledThumb } from "./GeocodingSuggestionsStyles";
import {
  StyledBoxAt,
  StyledBoxMain,
  StyledBoxName,
  StyledBoxRegion,
  StyledBoxScore,
  StyledSuggestionBox,
} from "./SuggestionBoxStyles";

/**
 * One suggestion, small enough to put several in a list and read them at once.
 *
 * The card in the panel exists to be studied — sources, spread, every match,
 * the controls that accept it. This exists to be chosen between: a name, a
 * picture, a score and a coordinate, which is what tells four places called
 * Riva apart when the question is only "which one".
 *
 * Pressable where `onChoose` is given and inert otherwise, because it is also
 * used to show what a run already decided — and a record of what happened is
 * not a control.
 */

interface SuggestionBox {
  suggestion: Suggestion;
  /** Its place in the run, drawn as the reader counts rather than as an index. */
  rank: number;
  /**
   * The best score in the run this suggestion came from, which the bar is drawn
   * against. A score orders answers within one query and means nothing between
   * two, so there is nothing else it could honestly be drawn against.
   */
  topScore: number;
  onChoose?: () => void;
  /** Said on the control, where the act rather than the place is named. */
  actionLabel?: string;
}

export const SuggestionBox: React.FC<SuggestionBox> = ({
  suggestion,
  rank,
  topScore,
  onChoose,
  actionLabel,
}) => {
  const { name, region } = splitLabel(suggestion.label);
  return (
    <StyledSuggestionBox
      as={onChoose ? "button" : "div"}
      type={onChoose ? "button" : undefined}
      $pressable={!!onChoose}
      onClick={onChoose}
      title={onChoose ? actionLabel : undefined}
      aria-label={onChoose ? `${actionLabel}: ${suggestion.label}` : suggestion.label}
    >
      {suggestion.attachment ? (
        <StyledThumb src={suggestion.attachment.url} alt="" loading="lazy" />
      ) : null}
      <StyledBoxMain>
        <StyledBoxName title={suggestion.label}>
          {rank}. {name}
        </StyledBoxName>
        {region ? <StyledBoxRegion title={region}>{region}</StyledBoxRegion> : null}
        <StyledBoxAt>
          {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)} · {suggestion.signals.agreement}{" "}
          sources
        </StyledBoxAt>
      </StyledBoxMain>
      <StyledBoxScore>
        <StyledScoreBar $share={scoreShare(suggestion.score, topScore)} />
        {suggestion.score.toFixed(2)}
      </StyledBoxScore>
    </StyledSuggestionBox>
  );
};
