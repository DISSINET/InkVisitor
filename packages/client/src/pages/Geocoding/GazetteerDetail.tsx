import React from "react";
import type { EngineSuggester } from "./engineTypes";
import {
  categoryLabel,
  coverageGroups,
  licenceChips,
  sizeSentence,
  weightSentence,
} from "./gazetteerDetails";
import {
  StyledDetailChip,
  StyledDetailChips,
  StyledDetailLabel,
  StyledDetailLimits,
  StyledDetailLink,
  StyledDetailRow,
  StyledDetailSmall,
  StyledGazetteerDetail,
} from "./GazetteerPickerStyles";

/**
 * What the engine says about one source, laid out to be read before deciding
 * whether to ask it: what it is, what it is good for, what it cannot do, and on
 * what terms its data may be used.
 *
 * Everything here comes from `GET /suggesters`; nothing is written by this page.
 * A part the engine did not fill in is left out rather than shown blank.
 */

interface GazetteerDetail {
  suggester: EngineSuggester;
}

export const GazetteerDetail: React.FC<GazetteerDetail> = ({ suggester }) => {
  const { info, coverage, footprint, weight, health, category } = suggester;
  const groups = coverageGroups(coverage);
  const license = info.license;

  return (
    <StyledGazetteerDetail>
      <StyledDetailChips>
        <StyledDetailChip $tone="neutral">{categoryLabel(category)}</StyledDetailChip>
        {license
          ? licenceChips(license).map((chip) => (
              <StyledDetailChip key={chip.label} $tone={chip.tone}>
                {chip.label}
              </StyledDetailChip>
            ))
          : null}
        {health.status !== "ready" ? (
          <StyledDetailChip $tone="bad">{health.reason || health.status}</StyledDetailChip>
        ) : null}
      </StyledDetailChips>

      {info.description ? <div>{info.description}</div> : null}

      <StyledDetailRow>
        <StyledDetailLabel>good for</StyledDetailLabel>
        {groups.length ? (
          <div>
            {groups.map((group) => (
              <StyledDetailRow key={group.title}>
                <StyledDetailLabel>{group.title}</StyledDetailLabel>
                <StyledDetailChips>
                  {group.items.map((item) => (
                    <StyledDetailChip key={item} $tone="neutral">
                      {item}
                    </StyledDetailChip>
                  ))}
                </StyledDetailChips>
              </StyledDetailRow>
            ))}
          </div>
        ) : (
          <span>
            declares no particular region, period, language or kind of place — asked about
            anything
          </span>
        )}
      </StyledDetailRow>

      {info.limitations ? (
        <StyledDetailRow>
          <StyledDetailLabel>cannot do</StyledDetailLabel>
          <StyledDetailLimits>{info.limitations}</StyledDetailLimits>
        </StyledDetailRow>
      ) : null}

      <StyledDetailRow>
        <StyledDetailLabel>data</StyledDetailLabel>
        <span>
          {sizeSentence(footprint)}. {weightSentence(weight)}
        </span>
      </StyledDetailRow>

      {license?.attributionText ? (
        <StyledDetailRow>
          <StyledDetailLabel>credit as</StyledDetailLabel>
          <span>{license.attributionText}</span>
        </StyledDetailRow>
      ) : null}
      {license?.notes ? (
        <StyledDetailRow>
          <StyledDetailLabel>licence note</StyledDetailLabel>
          <StyledDetailSmall>{license.notes}</StyledDetailSmall>
        </StyledDetailRow>
      ) : null}
      {info.citation ? (
        <StyledDetailRow>
          <StyledDetailLabel>cite</StyledDetailLabel>
          <StyledDetailSmall>{info.citation}</StyledDetailSmall>
        </StyledDetailRow>
      ) : null}
      {info.homepage ? (
        <StyledDetailRow>
          <StyledDetailLabel>homepage</StyledDetailLabel>
          <StyledDetailLink href={info.homepage} target="_blank" rel="noreferrer">
            {info.homepage}
          </StyledDetailLink>
        </StyledDetailRow>
      ) : null}
    </StyledGazetteerDetail>
  );
};
