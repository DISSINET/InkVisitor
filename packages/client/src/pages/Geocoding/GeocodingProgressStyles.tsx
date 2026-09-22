import styled, { css, keyframes } from "styled-components";
import { sourceColor } from "./MatchTagStyles";
import { SourceState } from "./stageProgress";

export type StepState = "done" | "running" | "waiting";

export const StyledRail = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[2]};
`;

export const StyledRailHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledSubject = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledElapsed = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * One stage of the pipeline.
 *
 * The connector is drawn on the step rather than between steps so that the last
 * one can drop it, which is what makes the rail end rather than trail off.
 */
export const StyledStep = styled.div<{ $state: StepState }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[3]};

  &:not(:last-child)::before {
    content: "";
    position: absolute;
    /* half the mark's width, so the line runs through the middle of the dots */
    left: 0.45rem;
    top: 1rem;
    bottom: 0;
    width: 1px;
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }

  &:last-child {
    padding-bottom: 0;
  }
`;

const beat = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.45); opacity: 0.55; }
`;

/**
 * The dot beside a stage: hollow while waiting, beating while it runs, solid
 * once it is behind us.
 */
export const StyledStepMark = styled.span<{ $state: StepState }>`
  position: relative;
  flex: 0 0 auto;
  width: 0.9rem;
  height: 0.9rem;
  margin-top: 0.3rem;
  border-radius: 50%;
  border: 1px solid
    ${({ theme, $state }) =>
      $state === "waiting" ? theme.color["gray"][400] : theme.color["primary"]};
  background-color: ${({ theme, $state }) =>
    $state === "waiting" ? theme.color["white"] : theme.color["primary"]};

  ${({ $state }) =>
    $state === "running" &&
    css`
      animation: ${beat} 1.4s ease-in-out infinite;
    `}
`;

export const StyledStepWord = styled.div<{ $state: StepState }>`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme, $state }) =>
    $state === "waiting" ? theme.color["greyer"] : theme.color["black"]};
  opacity: ${({ $state }) => ($state === "waiting" ? 0.6 : 1)};
  transition:
    opacity 0.3s ease-in-out,
    color 0.3s ease-in-out;
`;

export const StyledDetail = styled.span`
  margin-left: ${({ theme }) => theme.space[2]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * Every gazetteer at once, in fixed order.
 *
 * Fixed because the board is read by position: a grid that reordered itself as
 * answers arrived would make the reader find each cell again on every frame.
 */
export const StyledBoard = styled.div`
  /* one column at every width. An auto-fitting grid reflows between one and two
     columns as the panel is dragged and as the longest name changes, which moves
     every cell the reader had just located */
  display: flex;
  flex-direction: column;
  padding-top: ${({ theme }) => theme.space[2]};
`;

/**
 * Holds the board's full height from the first frame to the last.
 *
 * The board is drawn as soon as the engine names the archives and stays until
 * the run ends, so nothing below it moves while the counts arrive. Appearing
 * when the asking step was reached made the whole panel jump at the moment a
 * reader was watching it most closely — and every line under it is a step of
 * the same run, so the jump moved the thing being read.
 */
export const StyledBoardSlot = styled.div`
  overflow: hidden;
`;

/**
 * One archive.
 *
 * Excluded is the one state drawn as absence — it will never report, and the
 * reason is on the cell. The rest are degrees of having been heard from, so
 * they share a weight and differ only in colour.
 */
/**
 * One archive, as a row.
 *
 * The bar behind the name is that source's share of the largest answer, so the
 * board says which archives carried the query as well as which have replied —
 * `gov` returning 304 records and `viabundus` returning 1 are not the same
 * event, and the counts alone put them side by side.
 */
export const StyledSourceCell = styled.div<{ $state: SourceState; $share: number }>`
  position: relative;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0.25rem ${({ theme }) => theme.space[1]};
  opacity: ${({ $state }) => ($state === "excluded" ? 0.45 : $state === "waiting" ? 0.6 : 1)};
  transition: opacity 0.3s ease-in-out;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $share }) => Math.max(0, Math.min(1, $share)) * 100}%;
    background-color: ${({ theme }) => theme.color["gray"][200]};
    transition: width 0.4s ease-in-out;
  }

  /* the state's own mark, which survives a share of zero */
  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: ${({ theme, $state }) =>
      $state === "answered"
        ? theme.color["primary"]
        : $state === "failed"
          ? theme.color["danger"]
          : $state === "empty"
            ? theme.color["gray"][400]
            : theme.color["gray"][300]};
  }

  > * {
    position: relative;
  }
`;

/**
 * The archive's own name, in the archive's own colour.
 *
 * The same hue this gazetteer is drawn in on every match tag in the panel, so
 * the board and the answers it produced are read as one thing rather than as a
 * list of slugs and, later, a list of coloured tags that happen to share words.
 *
 * Excluded and failed sources keep the hue and lose their weight to the cell's
 * opacity: greying the name as well would take away the one thing that says
 * which archive is missing.
 */
export const StyledSourceName = styled.span<{ $source: string }>`
  flex: 1;
  min-width: 0;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme, $source }) => sourceColor(theme, $source)};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledSourceCount = styled.span<{ $state: SourceState }>`
  flex: 0 0 auto;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme, $state }) =>
    $state === "answered" ? theme.color["black"] : theme.color["greyer"]};
`;

/**
 * The name forms the engine decided to search, under the step that decided them.
 *
 * Wrapping rather than a column: there are two or three of them, they are short,
 * and a run of chips reads as one answer to one question where a stacked list
 * would read as a second board.
 */
export const StyledCandidateForms = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
  padding-top: ${({ theme }) => theme.space[1]};
`;

export const StyledCandidateForm = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0 ${({ theme }) => theme.space[1]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["black"]};
`;

/** How well the engine thinks the form denotes the place, 0 to 1. */
export const StyledCandidateFit = styled.span`
  font-family: monospace;
  color: ${({ theme }) => theme.color["greyer"]};
`;
