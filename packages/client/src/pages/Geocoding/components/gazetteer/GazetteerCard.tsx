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
  descriptionBelowScope,
  itemsOf,
  oftenFails,
  scopeLine,
  speedOf,
} from "../../utils/context/gazetteerFacts";
import {
  StyledCardChip,
  StyledCardChips,
  StyledCardCoverage,
  StyledCardHead,
  StyledCardKind,
  StyledCardLabel,
  StyledCardLead,
  StyledCardLimits,
  StyledCardLink,
  StyledCardRow,
  StyledCardSection,
  StyledCardSmall,
  StyledCardTitle,
  StyledGazetteerCard,
} from "./GazetteerCardStyles";

/**
 * What the engine says about one source, read while deciding whether to ask it.
 *
 * In three parts, the one that decides first: what the source covers, how long
 * it takes, how much it holds, what it is good for and its limitations; then on
 * what terms its data may be used; then the description, the figures behind the
 * chips, the citation and the homepage.
 *
 * Everything here comes from `GET /suggesters`; nothing is written by this page.
 * A part the engine did not fill in is left out rather than shown blank.
 */

interface GazetteerCard {
  suggester: EngineSuggester;
}

/** A sentence ending as one, whatever the engine ended its text with. */
const sentence = (text: string): string => (/[.!?]$/.test(text) ? text : `${text}.`);

export const GazetteerCard: React.FC<GazetteerCard> = ({ suggester }) => {
  const { info, coverage, footprint, weight, health, category } = suggester;
  const groups = coverageGroups(coverage);
  const license = info.license;
  const scope = scopeLine(suggester);
  const speed = speedOf(suggester);
  const items = itemsOf(suggester);
  const fails = oftenFails(suggester);
  const unwell = health.status !== "ready";
  const about = descriptionBelowScope(suggester);
  const recordsText = items?.sentence.trim() || sizeSentence(footprint);

  const hasTerms = !!license;
  const speedText = [speed?.sentence, fails?.sentence].filter(Boolean).join(" ");

  return (
    <StyledGazetteerCard>
      <StyledCardHead>
        <StyledCardTitle>
          <GazetteerMark />
          {suggester.name}
        </StyledCardTitle>
        <StyledCardKind>{categoryLabel(category)}</StyledCardKind>
      </StyledCardHead>

      {scope ? <StyledCardLead>{scope}</StyledCardLead> : null}
      {unwell || speed || fails || items ? (
        <StyledCardChips>
          {unwell ? <StyledCardChip $tone="bad">{health.reason || health.status}</StyledCardChip> : null}
          {speed ? <StyledCardChip $tone={speed.tone}>{speed.label}</StyledCardChip> : null}
          {fails ? <StyledCardChip $tone="bad">often fails</StyledCardChip> : null}
          {items ? <StyledCardChip $tone="neutral">{items.label}</StyledCardChip> : null}
        </StyledCardChips>
      ) : null}

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
          <span>anything: it declares no particular region, period, language or gazetteer location type</span>
        )}
      </StyledCardRow>
      {info.limitations ? (
        <StyledCardRow>
          <StyledCardLabel>limitations</StyledCardLabel>
          <StyledCardLimits>{info.limitations}</StyledCardLimits>
        </StyledCardRow>
      ) : null}

      {hasTerms ? (
        <StyledCardSection>
          <StyledCardRow>
            <StyledCardLabel>terms</StyledCardLabel>
            <StyledCardChips>
              {licenceChips(license).map((chip) => (
                <StyledCardChip key={chip.label} $tone={chip.tone}>
                  {chip.label}
                </StyledCardChip>
              ))}
            </StyledCardChips>
          </StyledCardRow>
          {license.attributionText ? (
            <StyledCardRow>
              <StyledCardLabel>credit as</StyledCardLabel>
              <StyledCardSmall>{license.attributionText}</StyledCardSmall>
            </StyledCardRow>
          ) : null}
          {license.notes ? (
            <StyledCardRow>
              <StyledCardLabel>licence note</StyledCardLabel>
              <StyledCardSmall>{license.notes}</StyledCardSmall>
            </StyledCardRow>
          ) : null}
        </StyledCardSection>
      ) : null}

      <StyledCardSection>
        {about ? (
          <StyledCardRow>
            <StyledCardLabel>about</StyledCardLabel>
            <StyledCardSmall>{about}</StyledCardSmall>
          </StyledCardRow>
        ) : null}
        <StyledCardRow>
          <StyledCardLabel>records</StyledCardLabel>
          <StyledCardSmall>{sentence(recordsText)}</StyledCardSmall>
        </StyledCardRow>
        {speedText ? (
          <StyledCardRow>
            <StyledCardLabel>speed</StyledCardLabel>
            <StyledCardSmall>{speedText}</StyledCardSmall>
          </StyledCardRow>
        ) : null}
        <StyledCardRow>
          <StyledCardLabel>weight</StyledCardLabel>
          <StyledCardSmall>{weightSentence(weight)}</StyledCardSmall>
        </StyledCardRow>
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
      </StyledCardSection>
    </StyledGazetteerCard>
  );
};
