import { Button, ButtonGroup, Modal, ModalContent, ModalFooter, ModalHeader } from "components";
import React from "react";
import { Suggestion } from "./engineTypes";
import { BatchRun, BatchStep, batchSummary, nextUnsettled, tallyOf } from "./geocodingBatch";
import { SuggestionBox } from "./SuggestionBox";
import {
  StyledBatchChoices,
  StyledBatchEntry,
  StyledBatchLabel,
  StyledBatchList,
  StyledBatchMark,
  StyledBatchNote,
  StyledBatchRow,
  StyledBatchSummary,
  StyledBatchToggle,
} from "./GeocodingBatchModalStyles";
import { StyledSectionNote } from "./GeocodingSettingsModalStyles";

/**
 * What a run over the marked set is doing, and what it decided.
 *
 * Opened when the run starts and again when it ends, and closable in between:
 * the point of a batch is not having to watch it, so the window that reports on
 * one must be dismissible without stopping it. Closing it leaves the run alone —
 * the bar the run was started from keeps the summary and opens this again.
 *
 * The list carries every Location the run will visit from the first frame, in
 * the order it will visit them, so nothing moves under the eye except the state
 * of one row at a time.
 */

/**
 * What a state means, for a row that has no reason of its own to give.
 *
 * A refusal carries the engine's own words and says them instead; these are for
 * the states where nothing happened yet, or where what happened needs no
 * explaining.
 */
const STATE_SAYS: Record<BatchStep["state"], string> = {
  waiting: "",
  running: "asking the engine…",
  written: "written",
  skipped: "",
  failed: "the write did not go through",
};

/**
 * How many answers a refusal offers before the rest are somebody else's problem.
 *
 * This list exists for a quick decision between a few plausible places. A run
 * that came back with forty-four is not a quick decision, and the panel — where
 * the whole run can be read with its evidence — is where that one belongs.
 */
const BATCH_CHOICES = 6;

/**
 * The one line under the summary, which depends on what kind of run this was.
 *
 * A run of one was started from a row and had nothing marked, so the sentence
 * about what is still marked is not true of it.
 */
const note = (run: BatchRun, tally: ReturnType<typeof tallyOf>): string => {
  if (!run.done) {
    return "This can be closed — the run carries on, and the marked bar opens it again.";
  }
  if (tally.total === 1) {
    return tally.written
      ? "Written."
      : "Nothing was written. Choose one below, or open the Location to read the whole run.";
  }
  return tally.skipped
    ? "What was geocoded has been unmarked. The rest are still marked, so the list holds exactly the Locations still wanting a person."
    : "What was geocoded has been unmarked.";
};

const MARK: Record<BatchStep["state"], string> = {
  waiting: "·",
  running: "▸",
  written: "✓",
  skipped: "—",
  failed: "✗",
};

interface GeocodingBatchModal {
  run: BatchRun;
  onClose: () => void;
  /** Stops the run after the Location in flight. Absent once it has ended. */
  onStop: (() => void) | undefined;
  /** Writes an answer the researcher picked for a Location the run would not decide. */
  onAssign: (step: BatchStep, suggestion: Suggestion) => void;
  /**
   * Selects a Location on the page behind, and closes this.
   *
   * For a refusal six boxes cannot settle: the panel holds the whole run with
   * its evidence, and that is a different question from "which of these".
   */
  onOpenLocation: (step: BatchStep) => void;
}

/** The best score among a step's kept answers, or nothing where it kept none. */
const topOf = (choices: { score: number }[]): number =>
  choices.length ? Math.max(...choices.map((one) => one.score)) : 0;

export const GeocodingBatchModal: React.FC<GeocodingBatchModal> = ({
  run,
  onClose,
  onStop,
  onAssign,
  onOpenLocation,
}) => {
  const tally = tallyOf(run);
  /**
   * Which refusals have been opened.
   *
   * Shut by default and per Location, because the list is read to find the ones
   * that need a decision — a window that opened every set of answers at once
   * would be a page of them with the summary scrolled off the top.
   */
  const [open, setOpen] = React.useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /**
   * The refusal being worked on, so the next one can be found from it.
   *
   * Held separately from what is open: a reader may open two to compare, and
   * the walk still has to know where it had got to.
   */
  const [at, setAt] = React.useState<string | null>(null);
  const rows = React.useRef(new Map<string, HTMLDivElement | null>());
  const left = run.steps.filter((step) => step.state === "skipped" || step.state === "failed");

  /**
   * Moves to the next Location still wanting a decision and opens it alone.
   *
   * Alone, because this is a walk rather than an accumulation: what was decided
   * a moment ago closing behind the reader is what keeps the list short enough
   * to see the next one in.
   */
  const goNext = (from: string | null = at) => {
    const id = nextUnsettled(run, from);
    if (!id) {
      return;
    }
    setAt(id);
    setOpen(new Set([id]));
    // after the state that renders it, so the row it scrolls to is the open one
    window.setTimeout(
      () => rows.current.get(id)?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
      0,
    );
  };

  return (
    <Modal showModal onClose={onClose} width="normal">
      <ModalHeader title="Batch geocoding" onClose={onClose} />
      <ModalContent column>
        <StyledBatchSummary>{batchSummary(run)}</StyledBatchSummary>
<StyledSectionNote>{note(run, tally)}</StyledSectionNote>
        <StyledBatchList>
          {run.steps.map((step) => {
            const choices = step.choices ?? [];
            // the bar on each card is drawn against the best of the answers the
            // run kept for this step, because a score compares only within the
            // run that produced it
            const topChoice = topOf(choices);
            const showing = open.has(step.id);
            return (
              <StyledBatchEntry
                key={step.id}
                ref={(element) => {
                  rows.current.set(step.id, element);
                }}
              >
                <StyledBatchRow $running={step.state === "running"}>
                  <StyledBatchMark $state={step.state} aria-label={step.state}>
                    {MARK[step.state]}
                  </StyledBatchMark>
                  <StyledBatchLabel
                    as="button"
                    type="button"
                    $waiting={step.state === "waiting"}
                    title={`open ${step.label} in the panel`}
                    onClick={() => onOpenLocation(step)}
                  >
                    {step.label}
                  </StyledBatchLabel>
                  <StyledBatchNote title={step.note}>
                    {step.note ?? STATE_SAYS[step.state]}
                  </StyledBatchNote>
                  {/* only where there is a decision to make. A Location that was
                      written has its answer below it already, and one still
                      waiting has no answers yet */}
                  {choices.length && step.state !== "written" ? (
                    <StyledBatchToggle
                      type="button"
                      aria-expanded={showing}
                      onClick={() => toggle(step.id)}
                    >
                      {showing
                        ? "hide"
                        : `choose from ${Math.min(choices.length, BATCH_CHOICES)}`}
                    </StyledBatchToggle>
                  ) : null}
                </StyledBatchRow>

                {/* what was written, shown as the thing it was rather than as a
                    pair of numbers: the run made this choice unread, and the one
                    check worth being cheap is whether it looks like the place */}
                {step.taken ? (
                  <StyledBatchChoices>
                    {/* what the run wrote, drawn against its own score: it was
                        the leader of the run it came from, and the run's other
                        answers are not kept beside a step that was written */}
                    <SuggestionBox
                      suggestion={step.taken.suggestion}
                      rank={1}
                      topScore={step.taken.suggestion.score}
                    />
                  </StyledBatchChoices>
                ) : null}

                {showing && step.state !== "written" ? (
                  <StyledBatchChoices>
                    {choices.slice(0, BATCH_CHOICES).map((suggestion, index) => (
                      <SuggestionBox
                        key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                        suggestion={suggestion}
                        rank={index + 1}
                        topScore={topChoice}
                        actionLabel="use this one"
                        onChoose={() => {
                          onAssign(step, suggestion);
                          // straight on to the next one still wanting a
                          // decision: a run of ninety with twelve refusals is
                          // twelve presses, not twelve presses and twelve scrolls
                          goNext(step.id);
                        }}
                      />
                    ))}
                    {choices.length > BATCH_CHOICES ? (
                      <StyledBatchToggle type="button" onClick={() => onOpenLocation(step)}>
                        the strongest {BATCH_CHOICES} of {choices.length} — open the Location to
                        read the rest
                      </StyledBatchToggle>
                    ) : null}
                  </StyledBatchChoices>
                ) : null}
              </StyledBatchEntry>
            );
          })}
        </StyledBatchList>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          {onStop ? <Button label="Stop" color="danger" onClick={onStop} /> : null}
          {left.length ? (
            <Button
              label={left.length === 1 ? "the one left" : `next of ${left.length}`}
              color="success"
              onClick={() => goNext()}
            />
          ) : null}
          <Button label="Close" color="primary" onClick={onClose} />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
