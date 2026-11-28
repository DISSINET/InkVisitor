import styled from "styled-components";

/**
 * The explanation of the coordinate rules, drawn below the rule's choice.
 *
 * The figures are drawn at one SVG unit to one CSS pixel, so their text takes the
 * theme's font sizes as everywhere else in the window. Measured as a container,
 * so the guide below lays itself out by the window's width, not the screen's.
 */
export const StyledRules = styled.div`
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
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

/** The cases to switch between, wrapping on a narrow window. */
export const StyledCaseSwitch = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
`;

/** One case; the case shown is filled. */
export const StyledCaseButton = styled.button<{ $current: boolean }>`
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid ${({ theme }) => theme.color["primary"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $current }) => ($current ? theme.color["primary"] : "transparent")};
  color: ${({ theme, $current }) => ($current ? theme.color["white"] : theme.color["primary"])};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["primary"]};
    outline-offset: 2px;
  }
`;

/** What the case is, in a sentence, above its figures. */
export const StyledCaseStory = styled.p`
  margin: 0;
  max-width: 80rem;
  line-height: 1.45;
  font-style: italic;
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

/** The figures, as many to a row as fit; one to a row on a narrow window. */
export const StyledRulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 34rem), 1fr));
  gap: ${({ theme }) => theme.space[2]};
`;

/** One rule's figure and text; the rule the settings hold is set on a tinted ground. */
export const StyledRule = styled.figure<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  margin: 0;
  padding: ${({ theme }) => theme.space[1]};
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

/** Whether the rule found the place searched. */
export const StyledVerdict = styled.figcaption<{ $found: boolean }>`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $found }) => ($found ? theme.color["primary"] : theme.color["danger"])};
`;

/** A figure, drawn at its pixel size and scaled down, never up, to a narrow column. */
export const StyledRuleFigure = styled.svg`
  display: block;
  max-width: 100%;
  height: auto;
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

/** The radius densest counts within. */
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

/** The extent of a town or a region in a case, under its records. */
export const StyledArea = styled.ellipse`
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

/** What each rule does, where it suits and what misleads it: one row per rule. */
export const StyledGuide = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1.4fr);
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[2]};
  line-height: 1.4;

  /* in a narrow window each rule is a stack: its name, what it picks, then its
     two lists, each saying which it is as the column heads no longer show */
  @container (max-width: 70rem) {
    grid-template-columns: minmax(0, 1fr);

    > :nth-child(-n + 4) {
      display: none;
    }

    > [data-label]::before {
      content: attr(data-label);
      font-style: italic;
    }
  }
`;

export const StyledGuideHead = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledGuideRule = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};

  @container (max-width: 70rem) {
    margin-top: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledGuideCell = styled.span`
  color: ${({ theme }) => theme.color["greyer"]};
`;
