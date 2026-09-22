import React, { useEffect, useState } from "react";
import {
  StyledBoard,
  StyledBoardSlot,
  StyledCandidateFit,
  StyledCandidateForm,
  StyledCandidateForms,
  StyledDetail,
  StyledElapsed,
  StyledRail,
  StyledRailHead,
  StyledSourceCell,
  StyledSourceCount,
  StyledSourceName,
  StyledStep,
  StyledStepMark,
  StyledStepWord,
  StyledSubject,
} from "./GeocodingProgressStyles";
import {
  advance,
  phaseRank,
  PHASE_ORDER,
  PHASE_WORDS,
  readSources,
  readStage,
  sourceTally,
} from "./stageProgress";

/**
 * What a request looks like while it runs.
 *
 * The wait is five to fifteen seconds of real work in four named stages, and the
 * engine publishes which one it is in. Drawing the stages rather than a spinner
 * is worth the space for a reason that is not decoration: a request that sits in
 * "asking the gazetteers" for ten seconds is a slow archive, and one that sits
 * in "working out which names to search for" is a slow language model — the two
 * are worth different reactions, and only this tells them apart.
 *
 * The rail advances but never fills smoothly. The engine publishes no fraction,
 * and a bar sliding towards an end it cannot see would be inventing one.
 *
 * Under the asking step the board names every gazetteer at once. It can draw its
 * full width immediately because the engine publishes the excluded set complete,
 * before the first source runs — so a cell is grey because that archive holds
 * nothing for this period or region, never because the display has not caught up.
 */

interface GeocodingProgress {
  /** The engine's latest line, or null before it has said anything. */
  stage: string | null;
  /** What the engine says about each gazetteer, as a snapshot. */
  sources: {
    answered: Record<string, number>;
    failed: Record<string, string>;
    excluded: Record<string, string>;
  };
  seconds: string;
  name: string;
  /**
   * The name forms this request will search, once the engine has decided them.
   *
   * Said under the naming step, which is the step that produced them. That step
   * is a language-model call and often the slowest part of a run, and until
   * these arrive the panel can only say it is happening — while these answer
   * whether the engine understood the place, ten seconds before any coordinate
   * does.
   */
  candidates: { name: string; nameFit: number }[];
}

export const GeocodingProgress: React.FC<GeocodingProgress> = ({
  stage,
  sources,
  seconds,
  name,
  candidates,
}) => {
  const reading = readStage(stage);

  // the running commentary is sampled about once a second while the sixteen
  // gazetteers answer within two, so most lines are never seen; holding the
  // furthest phase reached is what keeps the rail from stalling on the lines
  // that did arrive
  const [reached, setReached] = useState(-1);
  useEffect(() => setReached(-1), [name]);
  useEffect(() => {
    setReached((current) => advance(current, reading.phase));
  }, [reading.phase]);

  const readings = readSources(sources);
  const { heard, expected } = sourceTally(readings);

  // the bars are read against each other, so they scale to the biggest answer
  // rather than to a fixed ceiling nothing would ever reach
  const largest = readings.reduce((most, one) => Math.max(most, one.count || 0), 0);

  const asking = phaseRank("asking");
  const naming = phaseRank("naming");

  /** How far through the archives the run is, counting only those that will report. */
  const tally = `${heard} of ${expected}`;

  return (
    <StyledRail aria-live="polite" aria-label={`Geocoding ${name}`}>
      <StyledRailHead>
        <StyledSubject>{name}</StyledSubject>
        <StyledElapsed>{seconds}s</StyledElapsed>
      </StyledRailHead>

      {PHASE_ORDER.map((phase, index) => {
        const state = index < reached ? "done" : index === reached ? "running" : "waiting";
        return (
          <StyledStep key={phase} $state={state}>
            <StyledStepMark $state={state} />
            <div>
              <StyledStepWord $state={state}>
                {PHASE_WORDS[phase]}
                {index === asking && index <= reached ? <StyledDetail>{tally}</StyledDetail> : null}
              </StyledStepWord>
              {/* kept once the naming step is past rather than cleared with it:
                  every place the run goes on to find was found by searching
                  these, so they are read against the answers as much as during
                  the wait */}
              {index === naming && candidates.length ? (
                <StyledCandidateForms>
                  {candidates.map((candidate) => (
                    <StyledCandidateForm key={candidate.name}>
                      {candidate.name}
                      <StyledCandidateFit>{candidate.nameFit.toFixed(2)}</StyledCandidateFit>
                    </StyledCandidateForm>
                  ))}
                </StyledCandidateForms>
              ) : null}
              {/* drawn from the first frame and kept to the last: the engine
                  publishes the excluded set complete before the first source
                  runs, so the board can be its full size immediately — and
                  every line below it is a step of the same run, which a board
                  appearing partway would push down the panel */}
              {index === asking ? (
                <StyledBoardSlot>
                <StyledBoard>
                  {readings.map(({ source, state: sourceState, count, reason }) => (
                    <StyledSourceCell
                      key={source}
                      $state={sourceState}
                      $share={largest > 0 ? (count || 0) / largest : 0}
                      title={reason || `${source}: ${count ?? "no answer yet"}`}
                    >
                      <StyledSourceName $source={source}>{source}</StyledSourceName>
                      <StyledSourceCount $state={sourceState}>
                        {sourceState === "excluded"
                          ? "—"
                          : sourceState === "failed"
                            ? "!"
                            : count === undefined
                              ? "·"
                              : count}
                      </StyledSourceCount>
                    </StyledSourceCell>
                  ))}
                </StyledBoard>
                </StyledBoardSlot>
              ) : null}
            </div>
          </StyledStep>
        );
      })}
    </StyledRail>
  );
};
