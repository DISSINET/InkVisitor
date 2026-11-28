import styled from "styled-components";

/**
 * The explanation of the coordinate rules, drawn below the rule's choice.
 *
 * The figures are drawn at one SVG unit to one CSS pixel, so their text takes the
 * theme's font sizes as everywhere else in the window.
 */
export const StyledRules = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledRulesIntro = styled.p`
  margin: 0;
  max-width: 80rem;
  line-height: 1.5;
`;

/** What the dots, rings and colours of every figure mean, said once above them. */
export const StyledRulesLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledRulesLegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledRulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(32rem, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`;

/** One rule's figure and text; the rule the settings hold is set on a tinted ground. */
export const StyledRule = styled.figure<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  margin: 0;
  padding: ${({ theme }) => theme.space[2]};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.color["primary"] : "transparent")};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

export const StyledRuleName = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StyledRuleDefault = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledRuleText = styled.figcaption`
  line-height: 1.45;
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledRuleFigure = styled.svg`
  display: block;
  max-width: 100%;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

/**
 * One gazetteer record, in its gazetteer's colour: filled where it was found by
 * the place's own name, a ring where it was found by the name of a place around
 * it. A faded record takes no part in what the figure shows.
 */
export const StyledRecordDot = styled.circle<{ $color: string; $around: boolean; $faded: boolean }>`
  fill: ${({ $color, $around }) => ($around ? "none" : $color)};
  stroke: ${({ $color }) => $color};
  stroke-width: 1.5;
  opacity: ${({ $faded }) => ($faded ? 0.3 : 1)};
`;

/** The ring around the record a rule chooses. */
export const StyledChosenRing = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.color["primary"]};
  stroke-width: 1.5;
`;

/** A record's vote for the record chosen, in the voter's colour; its width, the vote's strength, is set per line. */
export const StyledVoteLine = styled.line<{ $color: string }>`
  stroke: ${({ $color }) => $color};
  stroke-linecap: round;
  opacity: 0.45;
`;

/** A distance a rule adds up. */
export const StyledDistanceLine = styled.line`
  stroke: ${({ theme }) => theme.color["greyer"]};
  stroke-width: 0.75;
  opacity: 0.7;
`;

/** A radius a rule counts within, or the citing distance. */
export const StyledRadius = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.color["primary"]};
  stroke-width: 1;
  stroke-dasharray: 3 2;
`;

export const StyledFigureLabel = styled.text`
  fill: ${({ theme }) => theme.color["greyer"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-style: italic;
`;

/** The chosen record's gazetteer, named beside its ring in the gazetteer's colour. */
export const StyledFigureName = styled.text<{ $color: string }>`
  fill: ${({ $color }) => $color};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;

export const StyledFigureScore = styled.text<{ $best: boolean }>`
  fill: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme, $best }) => ($best ? theme.fontWeight.bold : theme.fontWeight.normal)};
`;

/** The built-up area of the example's town, under its records. */
export const StyledTownArea = styled.ellipse`
  fill: ${({ theme }) => theme.color["gray"][300]};
`;

/** The marks of the example's places, in the figures and in the legend. */
export const StyledMapSymbol = styled.g`
  display: inline-flex;
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The scale bar, in the label colour. */
export const StyledScaleBar = styled.g`
  path {
    fill: none;
    stroke: ${({ theme }) => theme.color["greyer"]};
    stroke-width: 1;
  }
`;

/** A legend's sample dot, drawn as the figures draw one. */
export const StyledLegendSwatch = styled.svg`
  flex: 0 0 auto;
`;
