import styled from "styled-components";

/**
 * The card a gazetteer's tag shows on hover.
 *
 * Drawn for the tooltip it sits in: dark, so the text inherits the tooltip's
 * colour and every border is the text's own, thinned. The one thing set apart is
 * what the source cannot do, because it is the part that changes a decision.
 */
export const StyledGazetteerCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  width: 32rem;
  max-width: 100%;
  padding: ${({ theme }) => theme.space[1]};
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize.xs};
  line-height: 1.5;
`;

export const StyledCardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const StyledCardChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledCardChip = styled.span<{ $tone: "good" | "caution" | "bad" | "neutral" }>`
  padding: 0 ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $tone }) =>
    $tone === "caution"
      ? theme.color["warning"]
      : $tone === "bad"
        ? theme.color["warningBorder"]
        : "inherit"};
  font-weight: ${({ $tone }) => ($tone === "bad" ? 600 : 400)};
  border: 1px
    ${({ $tone }) => ($tone === "good" ? "solid" : $tone === "neutral" ? "dotted" : "solid")}
    currentColor;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  opacity: ${({ $tone }) => ($tone === "neutral" ? 0.85 : 1)};
`;

/** A label beside what it labels, in a column that lines up down the card. */
export const StyledCardRow = styled.div`
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: ${({ theme }) => theme.space[2]};
  align-items: start;
`;

export const StyledCardLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.65;
`;

/** What the source cannot do, set apart because it is the part that changes a decision. */
export const StyledCardLimits = styled.div`
  padding-left: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["warningMessage"]};
  border-left: 3px solid ${({ theme }) => theme.color["warning"]};
`;

export const StyledCardLink = styled.a`
  color: inherit;
  text-decoration: underline;
  word-break: break-all;
`;

export const StyledCardSmall = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  opacity: 0.8;
`;

export const StyledCardCoverage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

/** What a hover card is anchored to: the tag, or whatever stands for the source. */
export const StyledGazetteerAnchor = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 0.2em;
  max-width: 100%;
`;

/** The mark for the kind of source, beside its name and quieter than it. */
export const StyledGazetteerMark = styled.span`
  display: inline-flex;
  align-self: center;
  flex: 0 0 auto;
  font-size: 0.95em;
  opacity: 0.75;
`;

/** The tag a source is shown as: its slug, in the colour the source is drawn in everywhere else. */
export const StyledGazetteerFace = styled.span<{ $color: string }>`
  font-family: monospace;
  color: ${({ $color }) => $color};
  cursor: help;
  border-bottom: 1px dotted currentColor;
`;
