import React from "react";
import type { EngineSuggester } from "../../types/engine";
import { GazetteerMark } from "./GazetteerMark";
import {
  categoryLabel,
  coverageGroups,
  licenceChips,
  sizeSentence,
  weightSentence,
} from "../../utils/context/gazetteerDetails";
import {
  StyledCardChip,
  StyledCardChips,
  StyledCardCoverage,
  StyledCardLabel,
  StyledCardLimits,
  StyledCardLink,
  StyledCardRow,
  StyledCardSmall,
  StyledCardTitle,
  StyledGazetteerCard,
} from "./GazetteerCardStyles";

/**
 * What the engine says about one source, laid out to be read before deciding
 * whether to ask it: what it is, what it is good for, what it cannot do, and on
 * what terms its data may be used.
 *
 * Everything here comes from `GET /suggesters`; nothing is written by this page.
 * A part the engine did not fill in is left out rather than shown blank.
 */

interface GazetteerCard {
  suggester: EngineSuggester;
}

export const GazetteerCard: React.FC<GazetteerCard> = ({ suggester }) => {
  const { info, coverage, footprint, weight, health, category } = suggester;
  const groups = coverageGroups(coverage);
  const license = info.license;

  return (
    <StyledGazetteerCard>
      <StyledCardTitle>
        <GazetteerMark />
        {suggester.name}
      </StyledCardTitle>
      <StyledCardChips>
        <StyledCardChip $tone="neutral">{categoryLabel(category)}</StyledCardChip>
        {license
          ? licenceChips(license).map((chip) => (
              <StyledCardChip key={chip.label} $tone={chip.tone}>
                {chip.label}
              </StyledCardChip>
            ))
          : null}
        {health.status !== "ready" ? (
          <StyledCardChip $tone="bad">{health.reason || health.status}</StyledCardChip>
        ) : null}
      </StyledCardChips>

      {info.description ? <div>{info.description}</div> : null}

      <StyledCardRow>
        <StyledCardLabel>good for</StyledCardLabel>
        {groups.length ? (
          <StyledCardCoverage>
            {groups.map((group) => (
              <StyledCardChips key={group.title} aria-label={group.title}>
                <StyledCardLabel>{group.title}</StyledCardLabel>
                {group.items.map((item) => (
                  <StyledCardChip key={item} $tone="neutral">
                    {item}
                  </StyledCardChip>
                ))}
              </StyledCardChips>
            ))}
          </StyledCardCoverage>
        ) : (
          <span>
            declares no particular region, period, language or kind of place — asked about anything
          </span>
        )}
      </StyledCardRow>

      {info.limitations ? (
        <StyledCardRow>
          <StyledCardLabel>cannot do</StyledCardLabel>
          <StyledCardLimits>{info.limitations}</StyledCardLimits>
        </StyledCardRow>
      ) : null}

      <StyledCardRow>
        <StyledCardLabel>data</StyledCardLabel>
        <span>
          {sizeSentence(footprint)}. {weightSentence(weight)}
        </span>
      </StyledCardRow>

      {license?.attributionText ? (
        <StyledCardRow>
          <StyledCardLabel>credit as</StyledCardLabel>
          <span>{license.attributionText}</span>
        </StyledCardRow>
      ) : null}
      {license?.notes ? (
        <StyledCardRow>
          <StyledCardLabel>licence note</StyledCardLabel>
          <StyledCardSmall>{license.notes}</StyledCardSmall>
        </StyledCardRow>
      ) : null}
      {info.citation ? (
        <StyledCardRow>
          <StyledCardLabel>cite</StyledCardLabel>
          <StyledCardSmall>{info.citation}</StyledCardSmall>
        </StyledCardRow>
      ) : null}
      {info.homepage ? (
        <StyledCardRow>
          <StyledCardLabel>homepage</StyledCardLabel>
          <StyledCardLink href={info.homepage} target="_blank" rel="noreferrer">
            {info.homepage}
          </StyledCardLink>
        </StyledCardRow>
      ) : null}
    </StyledGazetteerCard>
  );
};
