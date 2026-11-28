import styled from "styled-components";

/**
 * The guide to the coordinate rules, opened below the rule's choice.
 *
 * Set apart from the settings as a tinted panel with an accent bar, so it reads
 * as advice rather than as more settings. The figures are drawn at one SVG unit
 * to one CSS pixel, so their text takes the theme's font sizes as everywhere else
 * in the window. Measured as a container, so the table lays itself out by the
 * window's width, not the screen's.
 */
export const StyledGuide = styled.div`
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-left: 3px solid ${({ theme }) => theme.color["primary"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["blue"][50]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledGuideQuestion = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
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
`;

/** Which rules find the place of the case shown, and which miss it. */
export const StyledCaseFit = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[4]};
`;

/** What the dots, rings and marks of every figure mean, said once above them. */
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

/** The figures, five to a row in the settings window; one to a row on a narrow one. */
export const StyledRulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr));
  gap: ${({ theme }) => theme.space[2]};
`;

/** One rule's figure and verdict; the rule the settings hold is outlined. */
export const StyledRule = styled.figure<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
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
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme, $found }) => ($found ? theme.color["primary"] : theme.color["danger"])};
`;

/** A figure, drawn at its pixel size and scaled down, never up, to a narrow column. */
export const StyledRuleFigure = styled.svg`
  display: block;
  max-width: 100%;
  height: auto;
  background-color: ${({ theme }) => theme.color["white"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

/**
 * One gazetteer record, in its gazetteer's colour: filled where it was found by
 * the place's own name, a ring where it was found by the name of a place around
 * it.
 */
export const StyledRecordDot = styled.circle<{ $color: string; $around: boolean }>`
  fill: ${({ $color, $around }) => ($around ? "none" : $color)};
  stroke: ${({ $color }) => $color};
  stroke-width: 1.5;
`;

/** The ring around the record a rule chooses. */
export const StyledChosenRing = styled.circle`
  fill: none;
  stroke: ${({ theme }) => theme.color["primary"]};
  stroke-width: 1.5;
`;

export const StyledFigureLabel = styled.text`
  fill: ${({ theme }) => theme.color["greyer"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-style: italic;
`;

/** The extent of a town or a region in a case, under its records. */
export const StyledArea = styled.ellipse`
  fill: ${({ theme }) => theme.color["gray"][200]};
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

/**
 * When to choose each rule and when not, one row per rule. In a narrow window
 * each row is a stack, every cell saying which column it is, as the column heads
 * no longer show.
 */
export const StyledTable = styled.table`
  width: 100%;
  margin-top: ${({ theme }) => theme.space[2]};
  border-collapse: collapse;
  line-height: 1.4;

  th,
  td {
    padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
    text-align: left;
    vertical-align: top;
  }

  thead th {
    font-size: ${({ theme }) => theme.fontSize.xxs};
    font-weight: ${({ theme }) => theme.fontWeight.normal};
    color: ${({ theme }) => theme.color["greyer"]};
    border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  }

  tbody th {
    white-space: nowrap;
    font-weight: ${({ theme }) => theme.fontWeight.bold};
  }

  tbody tr + tr > * {
    border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  }

  td:nth-child(2) {
    text-align: right;
    white-space: nowrap;
  }

  @container (max-width: 70rem) {
    thead {
      display: none;
    }

    tr,
    th,
    td {
      display: block;
    }

    tbody tr + tr > * {
      border-top: none;
    }

    tbody tr + tr {
      border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
    }

    td:nth-child(2) {
      text-align: left;
    }

    td::before {
      content: attr(data-label);
      font-style: italic;
      color: ${({ theme }) => theme.color["greyer"]};
    }
  }
`;

/** What the numbers are, under the table. */
export const StyledTableCaption = styled.caption`
  caption-side: bottom;
  padding-top: ${({ theme }) => theme.space[1]};
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** Opens and closes the footnote on how the rules pick, which starts closed. */
export const StyledHowToggle = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["primary"]};

  svg {
    font-size: ${({ theme }) => theme.fontSize.xxs};
    transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
    transition: transform 0.15s;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["primary"]};
    outline-offset: 2px;
  }
`;

export const StyledHow = styled.div`
  max-width: 80rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.color["greyer"]};

  p {
    margin: 0 0 ${({ theme }) => theme.space[1]};
  }
`;

export const StyledHowList = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.space[4]};
`;

export const StyledHowRule = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["black"]};
`;
