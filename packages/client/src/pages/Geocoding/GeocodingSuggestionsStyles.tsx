import styled from "styled-components";
import { OFF_REGION_FILL, scoreStep } from "./suggestionRank";

/**
 * The panel's horizontal gutter.
 *
 * The same value the Locations panel uses, so the three panels' contents start
 * on one line across the page rather than each at its own inset.
 */
const GUTTER = 4 as const;

export const StyledSuggestionsPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
`;

export const StyledPanelHead = styled.div`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[GUTTER]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledTarget = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["black"]};
`;

/** The selected Location's current coordinate — re-geocoding is a normal action. */
/**
 * The name of the Location being judged, and what is recorded against it.
 *
 * One line, wrapping rather than truncating: a Location's name can be a
 * sentence — "Maidstone, Kent History and Library Centre" — and the state
 * beside it is the shorter half, so it is the name that takes the second line
 * when there has to be one.
 */
export const StyledTargetLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledCurrent = styled.div`
  flex: 0 0 auto;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * What the run says, and the button that starts another.
 *
 * The facts read first and the control sits at the end of them, on the right,
 * where the eye arrives rather than where it starts. Left of the facts the
 * button separated the Location's name from everything said about it.
 */
export const StyledRunBar = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`;

export const StyledProgress = styled.div`
  flex: 1;
  min-width: 0;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledSuggestionList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
`;

/**
 * The repeating unit of the list, and the strongest horizontal rule in it.
 *
 * Drawn more faintly than the chips inside it, a card stops being the thing the
 * eye finds: a reader locates a list's unit by contrast, so twenty-five cards
 * outlined more lightly than their own contents read as one field of pills.
 */
/**
 * One suggestion, with its evidence.
 *
 * Nothing here is a control: the card is read, and the two things that write
 * from it name themselves. The rule between cards is what separates them, since
 * a filled ground on every card would be no separation at all.
 */
/**
 * One suggestion.
 *
 * Its left edge carries the card's own score, on the same ramp the score line
 * uses. Its ground says which of three kinds of suggestion it is: the leader
 * sits a shade darker, a place outside the region asked for is lighter and
 * quieter because it is worth less of the reader's attention, everything else
 * is plain.
 *
 * Off-region is routinely true — a name with namesakes finds them everywhere —
 * so its ground separates two thirds of a result set from the rest without
 * claiming anything is wrong with them.
 */
export const StyledCard = styled.div<{
  $offRegion?: boolean;
  $lead?: boolean;
  $highlighted?: boolean;
  $share: number;
}>`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[GUTTER]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  /* the same ramp the score line is drawn from, so the edge of the list says
     what its numbers say: the head of it is one colour and the tail another,
     and a reader scrolling past twenty cards sees where the strength runs out
     without reading a single figure.

     Gold on a clear leader, and only there. That is a different claim from a
     high score — the engine separated this one from the rest — and a run whose
     best answer is merely the best of a crowd shows no gold at all, which is
     the state a reader most needs to notice */
  border-left: 3px solid
    ${({ theme, $lead, $share }) =>
      $lead ? theme.color["warning"] : theme.color["scoreScale"][scoreStep($share)]};
  cursor: pointer;
  background-color: ${({ theme, $offRegion, $lead, $highlighted }) =>
    $highlighted
      ? theme.color["gray"][100]
      : $lead
        ? theme.color["gray"][200]
        : $offRegion
          ? theme.color["gray"][100]
          : "transparent"};
  /* pointed at from the map, drawn as though pointed at here: the ring on the
     mark and the ruled edge on the card are the two halves of one answer, so a
     reader looking at either finds the other without hunting for it */
  box-shadow: ${({ theme, $highlighted }) =>
    $highlighted ? `inset 3px 0 0 0 ${theme.color["success"]}` : "none"};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["success"]};
    outline-offset: -2px;
  }
`;

/** A heading, not a control: nothing on the card is hidden behind clicking it. */
export const StyledCardHead = styled.div`
  display: flex;
  /* centred rather than on a shared baseline: a rank disc, an icon, a name and
     a coordinate in monospace are four things whose baselines do not agree, so
     aligning on one of them leaves the other three sitting high */
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

/**
 * The engine's within-query ordering value. Deliberately quiet: it is not
 * comparable between places, and drawing it large reads as a confidence score,
 * which is the one thing it is not.
 */
export const StyledScore = styled.span`
  /* the coordinate sits immediately before it and both are monospace digits;
     without room between them they read as one number */
  margin-left: ${({ theme }) => theme.space[2]};
  /* fixed, so the column of them lines up down a list rather than shifting with
     whatever chips a card happens to carry */
  flex: 0 0 auto;
  width: 4rem;
  text-align: right;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  white-space: nowrap;
`;

export const StyledCardLabel = styled.span`
  flex: 1;
  min-width: 0;
  /* the one column that takes the slack, so everything after it starts at the
     same place on every row */
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["black"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Outside the query's region. Routinely true — 24 of the fixture's 37 — because
 * a name with namesakes finds them everywhere, and the engine demotes rather
 * than hides them. So this is a label, not an alarm: colouring it as a warning
 * would cry wolf on two thirds of every result set.
 */
export const StyledOffRegion = styled.span`
  flex: 0 0 auto;
  padding: 0 ${({ theme }) => theme.space[1]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  white-space: nowrap;
`;

export const StyledSignals = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[1]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledCardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
  margin-top: ${({ theme }) => theme.space[2]};
`;

export const StyledReject = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.space[2]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledEmptyPanel = styled.div`
  padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[GUTTER]};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.5;
`;

/**
 * What each gazetteer did, folded away behind what they did between them.
 *
 * One line per source and the engine has sixteen, so open it is furniture below
 * the scroller taller than a suggestion. It is read to settle one question —
 * does this absence mean anything — which the summary line answers on its own
 * most of the time.
 */
export const StyledSourceReport = styled.div`
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;

export const StyledSourceHead = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[GUTTER]};
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

/** Points down when the per-source lines are open. */
export const StyledSourceCaret = styled.span<{ $open: boolean }>`
  display: flex;
  flex: 0 0 auto;
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.2s ease-in-out;
`;

/** A source that broke is the part of the summary worth finding. */
export const StyledSourceFailed = styled.span`
  color: ${({ theme }) => theme.color["danger"]};
`;

export const StyledSourceLines = styled.div`
  max-height: 12rem;
  overflow-y: auto;
  padding: 0 ${({ theme }) => theme.space[GUTTER]} ${({ theme }) => theme.space[2]};
  line-height: 1.6;
`;

/**
 * A source that ran and found nothing is evidence; one that never ran is not.
 *
 * Three weights rather than five colours: what ran reads as text, what broke
 * reads as a fault, and what never ran stays quiet. A source skipped for being
 * outside the region is the ordinary case — most of the sixteen are, on any one
 * query — and drawing those as warnings put the alarm on the routine half of
 * the list. `warning` is also 2.16:1 here, which is why the page has a
 * `warningText` token for text that has to be read.
 */
export const StyledSourceLine = styled.div<{ $status: string }>`
  color: ${({ theme, $status }) => {
    switch ($status) {
      case "ran":
        return theme.color["black"];
      case "failed":
      case "unavailable":
        return theme.color["danger"];
      case "skipped":
      case "disabled":
        return theme.color["greyer"];
      default:
        return theme.color["warningText"];
    }
  }};
`;

/**
 * The numbers that ARE comparable between places — agreement, spread, margin.
 * These are what a researcher should be reading, so they carry the weight the
 * score used to.
 */
/**
 * A measurement: a figure and what it measures, with no edges.
 *
 * Boxed, it took the same shape as a record, a state and a control, and nothing
 * about that shape said which it was. The figure carries the weight and the
 * label sits quiet beside it, which is the distinction a number needs.
 */
export const StyledTrust = styled.span<{ $warn?: boolean }>`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme, $warn }) => ($warn ? theme.color["warningText"] : theme.color["black"])};

  em {
    font-style: normal;
    font-weight: ${({ theme }) => theme.fontWeight["normal"]};
    color: ${({ theme, $warn }) => ($warn ? theme.color["warningText"] : theme.color["greyer"])};
  }
`;

/**
 * Sits directly above the accept buttons, which is the only place it can be
 * read before the coordinate is written rather than after.
 */
export const StyledScatterNote = styled.div`
  padding: 0 ${({ theme }) => theme.space[GUTTER]} ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["warningText"]};
`;

/** An absent judgement is not a poor one, so it does not render as a number. */
export const StyledUnjudged = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** A photograph of the place, which is the fastest way a human recognises one. */
/**
 * The satellite tile or wiki picture, small until it is looked at.
 *
 * At 4.4rem it is a hint that something is there rather than something anyone
 * can judge from; growing it on hover answers "what does it look like" without
 * giving the picture room it does not deserve for the other twenty-four cards.
 * It grows over the card rather than pushing it, so nothing below moves.
 */
export const StyledThumb = styled.img`
  width: 4.4rem;
  height: 4.4rem;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  transition:
    transform 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
  transform-origin: top left;

  &:hover {
    transform: scale(3);
    box-shadow: ${({ theme }) => theme.boxShadow["high"]};
    position: relative;
    z-index: 10;
  }
`;

export const StyledCardBody = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  min-width: 0;
`;

export const StyledCardMain = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * What the engine searched for, beside the button that asked it.
 *
 * One line for the run rather than a line per card: the same few names appeared
 * under every suggestion, which answered a question about the request while
 * sitting in the place where the answer about the place belongs.
 */
/**
 * Everything about the run, stacked beside the button that started it.
 *
 * The count, the margin and the elapsed time say what came back; the names say
 * what was asked. Both are answers about the request rather than about any
 * place, so they sit together and leave the line above for the Location's own
 * name.
 */
export const StyledRunFacts = styled.div`
  /* drawn before the button though it comes after it in the markup: the button
     is the control the reader reaches for once, and the facts are what they
     read every time */
  order: -1;
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
`;

export const StyledSearched = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  strong {
    font-weight: ${({ theme }) => theme.fontWeight["medium"]};
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledShowMore = styled.button`
  display: block;
  width: 100%;
  cursor: pointer;
  border: none;
  background-color: transparent;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[GUTTER]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

/** Announced, not shown — the panel already says this visually. */
export const StyledLiveRegion = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * A one-line mark that the answer below is degraded. It sits above the list
 * rather than on a card, because what it reports is true of the whole answer:
 * every suggestion below it was computed the same degraded way. The reasons and
 * the remedy are long enough to push the first suggestion off the panel, so they
 * live in a tooltip and this strip stays one line however many stages were
 * skipped.
 */
export const StyledDegraded = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  margin: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[GUTTER]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border-left: 3px solid ${({ theme }) => theme.color["warningText"]};
  background-color: ${({ theme }) => theme.color["invertedBg"]["warning"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
  cursor: help;
`;

export const StyledDegradedIcon = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["warningText"]};
`;

/**
 * The sentences behind the strip, carried in the document for a screen reader.
 * The tooltip they also appear in exists only while the pointer is on the strip,
 * so it is not a place anything can be read from.
 */
export const StyledDegradedFullText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/** The banner text, in the tooltip the strip opens. */
export const StyledDegradedTip = styled.div`
  max-width: 28rem;

  ul {
    margin: ${({ theme }) => theme.space[1]} 0;
    padding-left: ${({ theme }) => theme.space[4]};
  }
`;

/**
 * The second half of accepting a coordinate, inside the card the accuracy was
 * chosen on. It stays in the card because the place it is about is the one whose
 * evidence is on screen; a modal would take that away at the moment it is needed.
 */
export const StyledTypeStep = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  background-color: ${({ theme }) => theme.color["gray"][100]};
`;

export const StyledTypeStepHead = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledTypeStepAside = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledTypeChoices = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: ${({ theme }) => theme.space[1]};
`;

/**
 * `$suggested` marks the type the sources called it — a starting point rather
 * than an answer, so it is highlighted and never preselected.
 */
export const StyledTypeChoice = styled.button<{ $suggested?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: 1px solid
    ${({ theme, $suggested }) =>
      $suggested ? theme.color["primary"] : theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
  text-align: left;

  svg {
    flex: 0 0 auto;
    font-size: ${({ theme }) => theme.fontSize.lg};
    color: ${({ theme, $suggested }) =>
      $suggested ? theme.color["primary"] : theme.color["greyer"]};
  }

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.color["primary"]};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.color["gray"][500]};

    svg {
      color: ${({ theme }) => theme.color["gray"][300]};
    }
  }
`;

export const StyledTypeStepActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[2]};
`;

/** Sits under the coordinate it does not touch, which is the point of it. */
export const StyledRetype = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} 0;

  svg {
    font-size: ${({ theme }) => theme.fontSize.lg};
    color: ${({ theme }) => theme.color["greyer"]};
  }
`;

/** The panel head's kind of place: its mark, its name, and the way to change it. */
export const StyledRetypeButton = styled.button<{ $unset?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0 ${({ theme }) => theme.space[1]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme }) => theme.color["white"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $unset }) => ($unset ? theme.color["greyer"] : theme.color["black"])};

  svg {
    font-size: ${({ theme }) => theme.fontSize.base};
    color: ${({ theme, $unset }) =>
      $unset ? theme.color["gray"][300] : theme.color["greyer"]};
  }

  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

/**
 * The suggestion's place in the order, as the map draws it.
 *
 * Ordinal rather than the score, which orders one query and means nothing
 * between them. One weight for every position: the number is the identification
 * and it is exact, where a fade asks a reader to judge an order the number
 * already states.
 */
export const StyledRank = styled.span<{ $offRegion?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  /* the same mark the map draws: a disc with the number in it, at one weight
     and emptied by the same amount when the place falls outside the query's
     region, so a card and its marker are recognisably one thing */
  border: ${({ theme }) => theme.borderWidth[2]} solid ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme, $offRegion }) =>
    $offRegion ? `rgb(from ${theme.color["black"]} r g b / ${OFF_REGION_FILL})` : theme.color["black"]};
  color: ${({ theme, $offRegion }) =>
    $offRegion ? theme.color["black"] : theme.color["white"]};
`;

/**
 * Whether the leader is actually ahead. Sits on the first card only, because
 * `margin` describes the gap between the top two rather than any one of them.
 */
/**
 * That the leader is actually ahead, as one mark.
 *
 * A star rather than the words: the name is the widest thing a reader needs and
 * the only one that cannot be shortened — two words beside it truncated
 * "Vicenza" to four characters, which is the opposite of what a leading
 * suggestion should do. The card's own ground carries the same claim, so this
 * is confirmation rather than the whole of it.
 */
export const StyledLead = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: ${({ theme }) => theme.fontSize.xs};
  /* the same gold as the card's own edge: one colour for one claim, so the star
     and the stripe are read as the same statement rather than as two */
  color: ${({ theme }) => theme.color["warning"]};
`;

/**
 * The score as a bar filled against the best in the same response.
 *
 * A share is the only comparison a score supports — its denominator moves
 * between queries — so the bar says "how far behind the best answer here" and
 * nothing that would survive being carried to another place. It fades with the
 * share for the same reason the map's markers do.
 */
/** Which of the five steps a share falls on. Five, because a reader can tell five apart. */
export const StyledScoreBar = styled.span<{ $share: number }>`
  display: block;
  width: 4rem;
  height: 3px;
  margin-bottom: 2px;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.color["gray"][300]};

  &::after {
    content: "";
    display: block;
    width: ${({ $share }) => Math.round($share * 100)}%;
    height: 100%;
    border-radius: 2px;
    background-color: ${({ theme, $share }) => theme.color["scoreScale"][scoreStep($share)]};
  }
`;

/**
 * One accept control per card instead of four.
 *
 * Four buttons of near-identical text, six cards deep, read as a wall rather
 * than as a choice. The accuracy a card leads with is the answer in the ordinary
 * case and stays one click away; the other three sit behind the caret.
 */
export const StyledUseAs = styled.div`
  position: relative;
  display: inline-flex;
`;

export const StyledUseAsMain = styled.button<{ $pending?: boolean }>`
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  border: none;
  border-right: 1px solid ${({ theme }) => theme.color["white"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]} 0 0
    ${({ theme }) => theme.borderRadius["sm"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  background-color: ${({ theme, $pending }) =>
    $pending ? theme.color["success"] : theme.color["primary"]};
  color: ${({ theme }) => theme.color["white"]};

  &:hover {
    opacity: 0.85;
  }
`;

export const StyledUseAsCaret = styled.button`
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space[2]};
  border: none;
  border-radius: 0 ${({ theme }) => theme.borderRadius["sm"]}
    ${({ theme }) => theme.borderRadius["sm"]} 0;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  background-color: ${({ theme }) => theme.color["primary"]};
  color: ${({ theme }) => theme.color["white"]};

  &:hover {
    opacity: 0.85;
  }
`;

/**
 * The match's coordinate, revealed on its row.
 *
 * Eight rows of decimals crowd out the labels that actually differ between
 * sources, which is what the table is read for. It stays in the document, so
 * anything reading the page aloud still has it.
 */

/**
 * Says what it does and how many, beside the matches it counts.
 *
 * Filled and stadium-shaped rather than outlined, because outlined it was the
 * same mark as the tags on either side of it and only its words said otherwise.
 */
export const StyledShowMatches = styled.button`
  border: none;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.color["gray"][200]};
  padding: 0 ${({ theme }) => theme.space[2]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
    color: ${({ theme }) => theme.color["black"]};
  }
`;

/**
 * The matches behind a suggestion, as tags.
 *
 * One row of tags replaces three lists that said overlapping things - the record
 * names, the sources that found them, and a table pairing the two. A match is a
 * gazetteer and the name it has for the place, so one tag holds a whole match
 * and the wrap does the rest.
 */
export const StyledMatchTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]};
  margin-top: ${({ theme }) => theme.space[1]};
`;

/** What kind of place it is. An indicator, with the word on its tooltip. */
export const StyledKind = styled.span`
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  font-size: ${({ theme }) => theme.fontSize.base};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * The coordinate, at the end of the line that names the place.
 *
 * It belongs on that line because it is what the line is about, and it belongs
 * at the end because it is read last — nobody scans a list of places by
 * latitude.
 */
export const StyledHeadCoordinate = styled.span`
  flex: 0 0 auto;
  /* a coordinate is monospace and its width is known, so giving it one keeps the
     column straight whether or not the row above carried an "off-region" chip */
  width: 11.5rem;
  text-align: right;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  white-space: nowrap;
`;

/**
 * What a card in a tie band says where the others say a score.
 *
 * A word rather than a number, because the number is the thing that would be
 * compared: six decimals under a banner announcing that they are not separable
 * make the banner an argument against the panel. The figures stay on the
 * tooltip, where reading them is a decision rather than a glance.
 */
export const StyledTied = styled.span`
  /* it stands where the decimal would, inside the score column, so the two read
     as the same field rather than as two different marks */
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
  white-space: nowrap;
`;

/**
 * The criteria the engine was given, kept beside the answers they shaped.
 *
 * Shown only while a request ran, they left the screen at the moment the
 * question they answer arrives — and a suggestion on the Portuguese coast reads
 * as plausible until "region europe" is sitting next to it.
 */
/**
 * Where a place is, under its name.
 *
 * Never truncated: four suggestions called Breslau are one name and four
 * administrative paths, and the path is the entire difference between Pierce
 * County Nebraska and Lavaca County Texas.
 */
export const StyledRegion = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * A suggestion card shown beside the pointer, over the map.
 *
 * Fixed to the viewport and offset from the point rather than centred on it, so
 * the mark being asked about stays visible while its card is read.
 *
 * It takes pointer events, because the coordinate is accepted from here: a
 * reader who has found the right place by hovering its mark should not have to
 * find its card in the list to say so. Moving onto it keeps it open — the map
 * loses the pointer at that moment and would otherwise close the card the
 * reader is reaching for.
 */
export const StyledHoverCard = styled.div<{ $left: number; $top: number }>`
  position: fixed;
  left: ${({ $left }) => $left + 16}px;
  top: ${({ $top }) => $top + 16}px;
  /* over the map's own mark card, and under a picker opened from this card's
     own accept button — see the theme's zIndex */
  z-index: ${({ theme }) => theme.zIndex.hoverCard};
  width: 34rem;
  max-width: calc(100vw - 2rem);
  max-height: 60vh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;
