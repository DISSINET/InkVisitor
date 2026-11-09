import React from "react";
import type { EngineSuggester } from "../../types/engine";
import { itemsOf, oftenFails, scopeLine, speedOf } from "../../utils/context/gazetteerFacts";
import { StyledCardChip, StyledCardChips } from "./GazetteerCardStyles";
import { StyledGazetteerScope } from "./GazetteerPickerStyles";

/**
 * What a source covers, how long it usually takes and how much it holds, under
 * its name in the gazetteer tables.
 *
 * Always drawn, not offered on hover: it is what a researcher reads to decide
 * whether to ask the source at all, and the card says the same at more length.
 * A part the engine did not publish is left out.
 */

interface GazetteerFacts {
  suggester: EngineSuggester;
}

export const GazetteerFacts: React.FC<GazetteerFacts> = ({ suggester }) => {
  const scope = scopeLine(suggester);
  const speed = speedOf(suggester);
  const items = itemsOf(suggester);
  const fails = oftenFails(suggester);

  if (!scope && !speed && !items && !fails) {
    return null;
  }
  return (
    <>
      {scope ? <StyledGazetteerScope>{scope}</StyledGazetteerScope> : null}
      {speed || items || fails ? (
        <StyledCardChips>
          {speed ? <StyledCardChip $tone={speed.tone}>{speed.label}</StyledCardChip> : null}
          {fails ? <StyledCardChip $tone="bad">often fails</StyledCardChip> : null}
          {items ? <StyledCardChip $tone="neutral">{items.label}</StyledCardChip> : null}
        </StyledCardChips>
      ) : null}
    </>
  );
};
