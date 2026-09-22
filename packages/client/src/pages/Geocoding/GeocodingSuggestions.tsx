import {
  GeocodingAccuracy,
  GeocodingPlaceType,
  IGeocodingContext,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { UserOptions } from "@inkvisitor/shared/types/response-user";
import { Button, Input, Tooltip } from "components";
import { IcoChevronDown, IcoGeocode, IcoStar, IcoWarning } from "Theme/icons";
import Dropdown from "components/advanced";
import React, { useEffect, useMemo, useState } from "react";
import { engineFeedback } from "./engine";
import { FeedbackReason, SuggestResponse, Suggestion } from "./engineTypes";
import { GeocodingProgress } from "./GeocodingProgress";
import { GeocodingProvenance } from "./geocodingWrite";
import { MatchTag } from "./MatchTag";
import { ACCURACY_ORDER, AccuracyPicker } from "./AccuracyPicker";
import { PlaceTypePicker } from "./PlaceTypePicker";
import { PlaceTypeIcon, placeTypeInfo } from "./placeTypeIcons";
import { degradationsOf } from "./suggestIntegrity";
import { splitLabel } from "./suggestionLabel";
import { bandOf, scoreShare, showsScore } from "./suggestionRank";
import { provenanceOf } from "./suggestionProvenance";
import {
  DEFAULT_MERGE_RADIUS_KM,
  SPREAD_WARNING_FRACTION,
  scatterOf,
  spreadIsMeasured,
  spreadWarningKm,
} from "./suggestionScatter";
import {
  StyledCard,
  StyledCardActions,
  StyledCardHead,
  StyledCardLabel,
  StyledCurrent,
  StyledDegraded,
  StyledDegradedFullText,
  StyledDegradedIcon,
  StyledDegradedTip,
  StyledEmptyPanel,
  StyledHoverCard,
  StyledOffRegion,
  StyledPanelHead,
  StyledProgress,
  StyledReject,
  StyledRunBar,
  StyledRunFacts,
  StyledLead,
  StyledRank,
  StyledRegion,
  StyledScatterNote,
  StyledScore,
  StyledScoreBar,
  StyledTied,
  StyledSignals,
  StyledSearched,
  StyledLiveRegion,
  StyledCardBody,
  StyledCardMain,
  StyledShowMore,
  StyledSourceLine,
  StyledSourceCaret,
  StyledSourceFailed,
  StyledSourceHead,
  StyledSourceLines,
  StyledSourceReport,
  StyledSuggestionList,
  StyledSuggestionsPanel,
  StyledTarget,
  StyledTargetLine,
  StyledThumb,
  StyledHeadCoordinate,
  StyledKind,
  StyledMatchTags,
  StyledShowMatches,
  StyledRetype,
  StyledRetypeButton,
  StyledTrust,
  StyledTypeChoice,
  StyledTypeChoices,
  StyledTypeStep,
  StyledTypeStepActions,
  StyledTypeStepAside,
  StyledTypeStepHead,
  StyledUnjudged,
  StyledUseAs,
  StyledUseAsCaret,
  StyledUseAsMain,
} from "./GeocodingSuggestionsStyles";
import { GeocodingLocation } from "./useGeocodingLocations";
import { GeocodingContextPanel } from "./GeocodingContextPanel";
import { QueryField, SingleQueryField, queryContextChanged } from "./geocodingContextFields";
import { UseGeocodingSuggest } from "./useGeocodingSuggest";

/**
 * The suggestions panel.
 *
 * `score` orders suggestions within one query and means nothing between
 * queries, so it is shown per card and never used to sort or compare places.
 * The numbers that are comparable — margin, agreement, spread — sit beside it.
 */

/** Enough to judge from; the rest are behind a control. */
export const VISIBLE_SUGGESTIONS = 6;
/** A source can contribute many matches to one place; the best few tell the story. */
/**
 * How many of a suggestion's matches are drawn before the rest are offered.
 *
 * Enough to see which sources agree, few enough that the run stays two lines:
 * a card's own head already carries the count, so this is the evidence rather
 * than the tally.
 */
const VISIBLE_MATCHES = 4;

/** Whether the per-source report is folded away. Reference, read once in twenty runs. */
const SOURCES_KEY = "geocoding:sourceReportOpen";

/**
 * What the run cost, where that can be said at all.
 *
 * A response the engine had already computed comes back in a millisecond or
 * two, and a duration is then a measurement of the cache rather than of the work
 * the number would be read as.
 */
const timing = (response: SuggestResponse) =>
  response.cached
    ? "from the engine's cache"
    : `${(response.elapsed_ms / 1000).toFixed(1)}s`;

/**
 * How the score was arrived at, as one line for the tooltip.
 *
 * The last factors are multipliers rather than components, so they are written
 * as multiplication: rendering them as bars beside evidence would misstate the
 * arithmetic. It reads on the number it explains rather than under the card,
 * because it explains one figure and is the least of what a card is read for.
 */
const scoreArithmetic = (suggestion: Suggestion) => {
  const { signals } = suggestion;
  const offRegion =
    signals.offRegionFactor !== 1 ? ` × off-region ${signals.offRegionFactor.toFixed(2)}` : "";
  return [
    `evidence ${signals.evidence.toFixed(2)} × context gate ${signals.contextGate.toFixed(2)}` +
      ` × candidate prior ${signals.candidatePrior.toFixed(2)}${offRegion}` +
      ` = ${suggestion.score.toFixed(2)}`,
    `evidence from convergence ${signals.convergence.toFixed(2)},` +
      ` match ${signals.matchScore.toFixed(2)},` +
      ` candidate diversity ${signals.candidateDiversity.toFixed(2)}`,
    "Orders this query only — a different set of sources runs for every place,",
    "so it cannot be compared with another location's.",
  ].join("\n");
};

const REASONS: { value: FeedbackReason; label: string }[] = [
  { value: "not-found", label: "not in the list at all" },
  { value: "ambiguous", label: "several are plausible" },
  { value: "other", label: "other" },
];


export const __testing = {
  provenanceOf,
  scatterOf,
  spreadIsMeasured,
  spreadWarningKm,
  timing,
  DEFAULT_MERGE_RADIUS_KM,
  SPREAD_WARNING_FRACTION,
};

type PendingAccept = {
  index: number;
  accuracy: GeocodingAccuracy | null;
  /** Where the kind picker opens from — the control that chose the accuracy. */
  anchor?: { left: number; top: number; bottom: number };
} | null;

interface SuggestionCard {
  suggestion: Suggestion;
  index: number;
  total: number;
  /** The strongest score in the response this card belongs to. */
  topScore: number;
  mergeRadiusKm: number | undefined;
  band: ReturnType<typeof bandOf>;
  roles: IGeocodingRoles;
  /** This card's own slice of `pending`, or null while it is not the one being accepted. */
  pendingHere: PendingAccept;
  accuracyMenuOpen: boolean;
  menuAnchor: { left: number; top: number; bottom: number } | null;
  /** Whether every match is drawn rather than the strongest few. */
  allMatches: boolean;
  onToggleMatches: () => void;
  onShowOnMap: (lat: number, lon: number) => void;
  /** The card's own accept button, or a choice made in its accuracy picker. */
  onUseAs: (accuracy: GeocodingAccuracy, anchor: { left: number; top: number; bottom: number }) => void;
  onOpenAccuracyMenu: (anchor: { left: number; top: number; bottom: number }) => void;
  onCloseAccuracyMenu: () => void;
  /** An accuracy picked in the card's own "how precisely is it known?" step. */
  onPickTypeStepAccuracy: (
    accuracy: GeocodingAccuracy,
    anchor: { left: number; top: number; bottom: number },
  ) => void;
  onCancelPending: () => void;
  onChooseKind: (accuracy: GeocodingAccuracy, placeType: GeocodingPlaceType | null) => void;
  /**
   * Drawn as evidence only, with nothing on it to press.
   *
   * What a hover over the map's mark shows. The reader is finding out which
   * place the mark is, not choosing it — and a control under a pointer that is
   * only passing through is a control pressed by accident.
   */
  preview?: boolean;
  /**
   * The pointer is on this suggestion, here or on the map.
   *
   * Drawn the same as the card's own hover, because it is the same fact: a
   * reader pointing at a mark on the map and a reader pointing at a card are
   * both asking which of these is which, and the answer belongs in both places.
   */
  highlighted?: boolean;
  /** Said as the pointer arrives on the card and again as it leaves. */
  onHover?: (on: boolean) => void;
}

/**
 * One suggestion, with the evidence behind it and the controls that accept it.
 *
 * A card is read to choose between places rather than to study one, so every
 * card always carries its own evidence — sources, spread, matches — rather
 * than folding it behind a click first: twenty-five cards each hiding what
 * they are is a page nobody scans.
 */
export const SuggestionCard: React.FC<SuggestionCard> = ({
  suggestion,
  index,
  total,
  topScore,
  mergeRadiusKm,
  band,
  roles,
  pendingHere,
  accuracyMenuOpen,
  menuAnchor,
  allMatches,
  onToggleMatches,
  onShowOnMap,
  onUseAs,
  onOpenAccuracyMenu,
  onCloseAccuracyMenu,
  onPickTypeStepAccuracy,
  onCancelPending,
  onChooseKind,
  preview = false,
  highlighted = false,
  onHover,
}) => {
  const { signals } = suggestion;
  const { scattered, leadAccuracy } = scatterOf(suggestion, mergeRadiusKm);
  const tied = !showsScore(band, index);
  const { name: placeName, region } = splitLabel(suggestion.label);

  return (
    <StyledCard
      $offRegion={suggestion.offRegion}
      $lead={index === 0 && !!band?.clear}
      $highlighted={highlighted}
      $share={scoreShare(tied ? topScore : suggestion.score, topScore)}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      role="group"
      aria-label={`suggestion ${index + 1}: ${suggestion.label}`}
      title={preview ? undefined : "click to show this on the map"}
      tabIndex={preview ? -1 : 0}
      // the card is the place: reading one and asking where it is are the
      // same gesture. Controls inside do their own job, so a press that
      // began on one is not also a request to move the map
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button, a, input, select")) {
          return;
        }
        onShowOnMap(suggestion.lat, suggestion.lon);
      }}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onShowOnMap(suggestion.lat, suggestion.lon);
        }
      }}
    >
      <StyledCardHead>
        {/* the same number the map draws on its markers, so the two panels
            can be read against each other without counting rows */}
        <StyledRank
          $offRegion={suggestion.offRegion}
          title={
            suggestion.offRegion
              ? `${index + 1} of ${total} — outside the region asked for`
              : `${index + 1} of ${total}`
          }
        >
          {index + 1}
        </StyledRank>
        {/* what kind of place it is, and nothing else. The same glyph opens
            the kind-of-place picker on a list row, so a mark that also
            travelled taught one symbol two jobs on one screen */}
        <StyledKind title={placeTypeInfo(suggestion.placeType).label}>
          <PlaceTypeIcon placeType={suggestion.placeType} />
        </StyledKind>
        <StyledCardLabel title={suggestion.label}>
          {placeName}
          {/* where it is, never truncated: four suggestions called Breslau
              are one name and four regions, and the region is the whole of
              what tells them apart */}
          {region ? <StyledRegion>{region}</StyledRegion> : null}
        </StyledCardLabel>
        {index === 0 && band?.clear ? (
          <StyledLead title="clear leader — ahead of the rest by more than the engine's own margin">
            <IcoStar />
          </StyledLead>
        ) : null}
        {suggestion.offRegion ? <StyledOffRegion>off-region</StyledOffRegion> : null}
        <StyledHeadCoordinate>
          {suggestion.lat.toFixed(4)}, {suggestion.lon.toFixed(4)}
        </StyledHeadCoordinate>
        {/* inside a band the panel draws no order: a decimal saying "0.52
            beats 0.44" outranks any softer mark, because a number is read
            without being looked at. The bar stays, drawn at the band's own
            strength rather than each card's, so every card in the band
            carries the same colour - which is what tied means. The figures
            are on the tooltip, where reading them is a decision */}
        <StyledScore title={scoreArithmetic(suggestion)}>
          <StyledScoreBar $share={scoreShare(tied ? topScore : suggestion.score, topScore)} />
          {tied ? <StyledTied>tied</StyledTied> : suggestion.score.toFixed(2)}
        </StyledScore>
      </StyledCardHead>

      <StyledCardBody>
        {suggestion.attachment ? (
          <StyledThumb
            src={suggestion.attachment.url}
            alt=""
            title={suggestion.attachment.attribution || suggestion.attachment.source}
            loading="lazy"
          />
        ) : null}
        <StyledCardMain>
          {/* the numbers that mean something between places carry the weight */}
          <StyledSignals>
            <StyledTrust>
              {signals.agreement} <em>sources</em>
            </StyledTrust>
            {spreadIsMeasured(suggestion) ? (
              <StyledTrust
                $warn={scattered}
                title={
                  scattered
                    ? `the sources place this ${suggestion.spreadKm.toFixed(0)} km apart, ` +
                      "so the coordinate is the middle of a group rather than the place"
                    : "median distance from the coordinate to the other matches"
                }
              >
                {suggestion.spreadKm.toFixed(1)}{" "}
                <em>{scattered ? "km apart, scattered" : "km apart"}</em>
              </StyledTrust>
            ) : (
              <StyledUnjudged>spread not measured</StyledUnjudged>
            )}
            {suggestion.contextFit == null ? (
              <StyledUnjudged>context not evaluated</StyledUnjudged>
            ) : (
              <StyledTrust>
                {suggestion.contextFit.toFixed(2)} <em>context</em>
              </StyledTrust>
            )}
          </StyledSignals>

          {/* a match is a gazetteer and the name it has for the place. Both
              are on the tag; how the source matched the name is drawn on its
              border, because that vocabulary is the engine's own and reads
              as a verdict when it is spelled out twenty times */}
          <StyledMatchTags>
            {(allMatches ? suggestion.matches : suggestion.matches.slice(0, VISIBLE_MATCHES)).map(
              (match, i) => (
                <MatchTag key={`${match.source}-${match.sourceId}-${i}`} match={match} />
              ),
            )}
            {suggestion.matches.length > VISIBLE_MATCHES ? (
              <StyledShowMatches type="button" onClick={onToggleMatches}>
                {allMatches
                  ? `show the strongest ${VISIBLE_MATCHES}`
                  : `show ${suggestion.matches.length - VISIBLE_MATCHES} more matches`}
              </StyledShowMatches>
            ) : null}
          </StyledMatchTags>
        </StyledCardMain>
      </StyledCardBody>

      {/* the reason and the control are two halves of one sentence: the
          button says "approximate" and this says why, close enough to be
          read as one thing. The whole of it stays on the chip's tooltip */}
      {scattered ? (
        <StyledScatterNote>
          the sources place this {suggestion.spreadKm.toFixed(0)} km apart
        </StyledScatterNote>
      ) : null}

      {preview ? null : (
      <StyledCardActions>
        {/* one button per card rather than four. The lead accuracy is the
            answer in the ordinary case and stays one click away; the other
            three are a caret away, which is where four times six buttons of
            near-identical text went */}
        <StyledUseAs>
          <StyledUseAsMain
            type="button"
            $pending={pendingHere?.accuracy === leadAccuracy}
            onClick={(event) => onUseAs(leadAccuracy, event.currentTarget.getBoundingClientRect())}
          >
            use as {leadAccuracy}
          </StyledUseAsMain>
          <StyledUseAsCaret
            type="button"
            aria-label="other accuracies"
            aria-haspopup="listbox"
            aria-expanded={accuracyMenuOpen}
            onClick={(event) => {
              if (accuracyMenuOpen) {
                onCloseAccuracyMenu();
                return;
              }
              const box = event.currentTarget.getBoundingClientRect();
              // the control's own box, not a pre-decided corner: the
              // picker measures itself and opens on whichever side it fits
              onOpenAccuracyMenu({ left: box.left, top: box.top, bottom: box.bottom });
            }}
          >
            <IcoChevronDown />
          </StyledUseAsCaret>

          {/* the same control the map asks this with, rather than a menu of
              four bare words: the accuracy is written on every Location and
              a list half the size of the one that follows it reads as the
              lesser of the two questions */}
          {accuracyMenuOpen && menuAnchor ? (
            <AccuracyPicker
              anchor={menuAnchor}
              suggested={leadAccuracy}
              note={
                scattered
                  ? `its sources sit ${suggestion.spreadKm.toFixed(1)} km apart`
                  : "its sources agree"
              }
              onChoose={(accuracy) => {
                onCloseAccuracyMenu();
                onUseAs(accuracy, menuAnchor);
              }}
              onClose={onCloseAccuracyMenu}
            />
          ) : null}
        </StyledUseAs>
      </StyledCardActions>
      )}

      {pendingHere && pendingHere.accuracy === null ? (
        <StyledTypeStep>
          <StyledTypeStepHead>
            how precisely is it known?
            <StyledTypeStepAside>
              {scattered
                ? `its sources sit ${suggestion.spreadKm.toFixed(1)} km apart`
                : "its sources agree"}
            </StyledTypeStepAside>
          </StyledTypeStepHead>
          <StyledTypeChoices>
            {ACCURACY_ORDER.map((accuracy) => (
              <StyledTypeChoice
                key={accuracy}
                type="button"
                $suggested={accuracy === leadAccuracy}
                title={
                  accuracy === leadAccuracy
                    ? `${accuracy} — what the spread of its sources argues for`
                    : accuracy
                }
                onClick={(event) =>
                  onPickTypeStepAccuracy(accuracy, event.currentTarget.getBoundingClientRect())
                }
              >
                <span>{accuracy}</span>
              </StyledTypeChoice>
            ))}
          </StyledTypeChoices>
          <StyledTypeStepActions>
            <Button label="back" color="greyer" onClick={onCancelPending} />
          </StyledTypeStepActions>
        </StyledTypeStep>
      ) : null}

      {/* the kind of place is asked with the same floating list the map
          asks it with, opened from the control that chose the accuracy —
          one control for one question, wherever the question comes up */}
      {pendingHere && pendingHere.accuracy !== null && pendingHere.anchor ? (
        <PlaceTypePicker
          anchor={pendingHere.anchor}
          roles={roles}
          current={null}
          suggested={suggestion.placeType}
          clearLabel="record no kind of place"
          onChoose={(placeType) =>
            onChooseKind(
              pendingHere.accuracy as GeocodingAccuracy,
              placeType as GeocodingPlaceType | null,
            )
          }
          onClose={onCancelPending}
        />
      ) : null}
    </StyledCard>
  );
};

interface GeocodingSuggestions {
  selected: GeocodingLocation | undefined;
  roles: IGeocodingRoles;
  context: IGeocodingContext;
  /** What each context field holds with no personal value on it. */
  projectContext: IGeocodingContext;
  onContextChange: (field: SingleQueryField, value: string) => void;
  /** The languages the name is stated to be in. Several are normal to the engine. */
  onContextLanguages: (values: string[]) => void;
  /** How much one of the four dimensions counts when sources are weighed. */
  onContextWeight: (field: QueryField, weight: number) => void;
  onContextReset: () => void;
  userOptions: UserOptions | undefined;
  suggest: UseGeocodingSuggest;
  /**
   * Whether the whole list is on screen rather than its strongest few. Held by
   * the page because the map draws the same suggestions and has to draw the same
   * number of them - a card numbered 7 against six markers numbers nothing.
   */
  showAll: boolean;
  /**
   * A suggestion the researcher picked off the map, and when.
   *
   * Carries the moment so that clicking the same marker twice asks twice — the
   * index alone would look unchanged and the second click would do nothing.
   */
  chosenOnMap: {
    index: number;
    accuracy: GeocodingAccuracy;
    placeType?: GeocodingPlaceType | null;
    at: number;
  } | null;
  /**
   * The suggestion under the pointer, from either side of the page.
   *
   * Held above both panels because either can be the one pointing: the map
   * reports a mark, the list reports a card, and each has to draw what the
   * other is pointing at.
   */
  highlighted?: number | null;
  /** Said as the pointer arrives on one of the cards, and again as it leaves. */
  onHoverCard?: (index: number | null) => void;
  onShowAll: () => void;
  engineReady: boolean;
  onAccept: (
    suggestion: Suggestion,
    accuracy: GeocodingAccuracy,
    provenance: GeocodingProvenance[],
    /**
     * What kind of place to record.
     *
     * `null` and `undefined` are different answers, and the write acts on the
     * difference: `null` records that this Location states no kind, removing
     * whatever it had; `undefined` says nothing about the kind and leaves it
     * standing. Accepting a suggestion where the question is switched off is
     * the second — a corrected coordinate is not a claim about what the place
     * is.
     */
    placeType: GeocodingPlaceType | null | undefined,
  ) => void;
  /**
   * The suggestion the pointer is over on the map, and where on screen it is.
   *
   * Drawn here rather than by the map because a card needs the whole run behind
   * it — the band it sits in, the strongest score its bar is measured against,
   * the roles it would be written with.
   */
  hovered?: { index: number; at: { left: number; top: number } } | null;
  /** True while the pointer is on the hovered card, which keeps it open. */
  onHoldHover?: (holding: boolean) => void;
  /** Moves the map to a suggestion, without choosing it. */
  onShowOnMap: (lat: number, lon: number) => void;
  /**
   * Records a kind of place on the selected Location without touching its
   * coordinate. Absent while the Location has no coordinate to keep.
   */
  onRetype: ((placeType: GeocodingPlaceType | null) => void) | undefined;
}

export const GeocodingSuggestions: React.FC<GeocodingSuggestions> = ({
  selected,
  roles,
  context,
  projectContext,
  onContextChange,
  onContextLanguages,
  onContextWeight,
  onContextReset,
  suggest,
  showAll,
  chosenOnMap,
  highlighted = null,
  onHoverCard,
  onShowAll,
  engineReady,
  onAccept,
  hovered,
  onHoldHover,
  onShowOnMap,
  onRetype,
}) => {

  /** The cards showing every match rather than the strongest few. */
  const [expandedMatches, setAllMatches] = useState<Set<number>>(() => new Set());
  /**
   * The suggestion being accepted, and how far through the two questions it is.
   *
   * A null accuracy means the first question is still open. Pressing a card's
   * own accept answers it on the way in; choosing a suggestion off the map does
   * not, because a marker states which place is meant and nothing about how
   * precisely it is known.
   */
  const [pending, setPending] = useState<PendingAccept>(null);
  /** The card whose other accuracies are open, if any. */
  const [accuracyMenu, setAccuracyMenu] = useState<number | null>(null);
  /** Where the open menu sits, measured from the caret that opened it. */
  const [menuAnchor, setMenuAnchor] = useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);
  /** Where the panel head's mark sits, while its picker is open. */
  const [showSources, setShowSources] = useState(
    () => localStorage.getItem(SOURCES_KEY) === "yes",
  );

  const [pickingHead, setPickingHead] = useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);
  const [reason, setReason] = useState<FeedbackReason>("not-found");

  const [degradedAnchor, setDegradedAnchor] = useState<HTMLDivElement | null>(null);
  const [degradedHovered, setDegradedHovered] = useState(false);
  const [note, setNote] = useState("");

  const { isRunning, elapsedMs, stage, error, isProvisional } = suggest;
  const name = selected?.entity.labels[0] || "";
  const locationId = selected?.entity.id;

  // A response belongs to the Location it was fetched for. Without this, a
  // request started on one place lands under another's name after the
  // researcher clicks ahead, and accepting it writes the first place's
  // coordinates onto the second.
  const response = suggest.responseFor && suggest.responseFor === locationId
    ? suggest.response
    : null;

  // a request still running for the previous Location is not this one's progress
  const isRunningForThis = isRunning && suggest.runningFor === locationId;

  // the preview frame has not reached the stages this reads, so judging it there
  // would report every request as degraded for its first second
  const degradations = useMemo(
    () => (response && !isProvisional ? degradationsOf(response) : []),
    [response, isProvisional],
  );

  // the strip shows two words, so the sentences behind it are the only form a
  // screen reader or a keyboard user ever gets
  const degradedSummary = degradations.length
    ? `This answer was computed with parts of the pipeline missing: ${degradations.join(
        "; ",
      )}. Running it again is usually enough — the causes are transient.`
    : "";

  // moving on abandons the request rather than letting it resolve into a panel
  // that has since changed underneath it
  useEffect(() => {
    if (suggest.runningFor && suggest.runningFor !== locationId) {
      suggest.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  // a fresh Location starts with its own top card open and its own list length.
  // The popups are keyed on a card index, which means something different for
  // every response, so anything left open would reopen against another place.
  useEffect(() => {
    setAccuracyMenu(null);
    setMenuAnchor(null);
    setAllMatches(new Set());
    setPending(null);
    setDegradedHovered(false);
  }, [locationId, response]);

  const seconds = (elapsedMs / 1000).toFixed(1);

  /**
   * What the sources did between them.
   *
   * Grouped the way the lines are coloured: what ran is evidence, what broke is
   * a fault worth chasing, and everything that never ran — out of coverage or
   * switched off — is the ordinary remainder.
   */
  const sourceTally = useMemo(() => {
    const sources = response?.sources || [];
    return {
      total: sources.length,
      ran: sources.filter((source) => source.status === "ran").length,
      failed: sources.filter(
        (source) => source.status === "failed" || source.status === "unavailable",
      ).length,
      skipped: sources.filter(
        (source) => source.status === "skipped" || source.status === "disabled",
      ).length,
    };
  }, [response]);

  /**
   * Whether the answer on screen was found under a different question.
   *
   * Only about the answer being shown: a context edited with no Location
   * selected, or before the first run, has nothing to invalidate — the ordinary
   * geocode button already carries whatever the fields say.
   */
  const answerIsStale =
    !!selected &&
    suggest.responseFor === selected.entity.id &&
    !!suggest.responseContext &&
    queryContextChanged(suggest.responseContext, context);

  const reject = () => {
    if (!response) {
      return;
    }
    // chosen: null is the engine's most informative event, and the reason is
    // what makes it countable - "not in the list" and "several are plausible"
    // argue for opposite fixes
    engineFeedback({
      query: response.query,
      chosen: null,
      suggestions: response.suggestions,
      reason,
      note: note.trim() || undefined,
    });
    setNote("");
    suggest.clear();
  };

  const accept = (
    suggestion: Suggestion,
    accuracy: GeocodingAccuracy,
    placeType: GeocodingPlaceType | null | undefined,
  ) => {
    setPending(null);
    onAccept(suggestion, accuracy, provenanceOf(suggestion), placeType);
    if (response) {
      engineFeedback({
        query: response.query,
        chosen: suggestion,
        suggestions: response.suggestions,
      });
    }
  };

  /**
   * An accuracy chosen on a card, waiting for the kind of place to go with it.
   *
   * The engine's own `placeType` is a starting point and not an answer: a
   * suggestion often carries none, and the twelve are decided by what the
   * researcher knows the place to be rather than by what the sources called it.
   */
  /**
   * What choosing an accuracy leads to: the kind of place, or the write.
   *
   * Every way of accepting a suggestion comes through here — the card's button,
   * the accuracy picker behind its caret, and the step a suggestion chosen off
   * the map leads to. A project that records no kind of place has nothing to
   * ask, and that has to be true of all three: asking on one of them makes the
   * question appear only for suggestions picked a particular way.
   */
  const chooseAccuracy = (
    index: number,
    suggestion: Suggestion,
    accuracy: GeocodingAccuracy,
    anchor?: { left: number; top: number; bottom: number },
  ) => {
    if (context.recordPlaceType === false) {
      // the kind named once for the whole corpus, or none where none was named
      // undefined rather than null where no kind was named for the corpus: the
      // question is switched off, which is not the same as answering "none" —
      // answering it would strip the kind off every Location whose coordinate
      // is corrected
      accept(suggestion, accuracy, context.defaultPlaceType ?? undefined);
      return;
    }
    setPending({ index, accuracy, anchor });
  };

  /**
   * A suggestion accepted by clicking its marker.
   *
   * Both questions were asked over the marker, where the researcher was
   * looking, so nothing is left to ask here. The panel still performs the
   * acceptance rather than the map writing directly: what a taken suggestion
   * owes the engine is one thing, known in one place, and a second path through
   * it would be a second chance to forget part of it.
   */
  useEffect(() => {
    if (!chosenOnMap || !response) {
      return;
    }
    const suggestion = response.suggestions[chosenOnMap.index];
    if (!suggestion) {
      return;
    }
    accept(suggestion, chosenOnMap.accuracy, chosenOnMap.placeType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenOnMap]);

  const band = useMemo(() => bandOf(response), [response]);

  /** The strongest score in the run, which every card's bar is drawn against. */
  const topScore = useMemo(
    () => Math.max(...(response?.suggestions ?? []).map((one) => one.score), 0),
    [response],
  );

  /** A preview presses nothing, so every control it carries is handed a no-op. */
  const noop = () => undefined;

  /**
   * The card for the mark the pointer is over on the map.
   *
   * The same component the list draws, with the same data, so the two are one
   * thing rather than two descriptions of it — and drawn as evidence only,
   * since a pointer passing over a mark is not choosing anything.
   */
  const hoveredCard =
    hovered && response && response.suggestions[hovered.index] ? (
      <StyledHoverCard
        $left={hovered.at.left}
        $top={hovered.at.top}
        role="group"
        aria-label="the suggestion under the pointer"
        onMouseEnter={() => onHoldHover?.(true)}
        onMouseLeave={() => onHoldHover?.(false)}
      >
        <SuggestionCard
          suggestion={response.suggestions[hovered.index]}
          index={hovered.index}
          total={response.suggestions.length}
          topScore={topScore}
          mergeRadiusKm={response.mergeRadiusKm}
          band={band}
          roles={roles}
          pendingHere={null}
          accuracyMenuOpen={accuracyMenu === hovered.index}
          menuAnchor={menuAnchor}
          allMatches={false}
          onToggleMatches={noop}
          onShowOnMap={noop}
          /* the whole point of reaching the card: the coordinate is accepted
             from the mark the reader found it by, rather than by hunting the
             same suggestion down in the list */
          onUseAs={(accuracy, anchor) =>
            chooseAccuracy(hovered.index, response.suggestions[hovered.index], accuracy, anchor)
          }
          onOpenAccuracyMenu={(anchor) => {
            setMenuAnchor(anchor);
            setAccuracyMenu(hovered.index);
          }}
          onCloseAccuracyMenu={() => setAccuracyMenu(null)}
          onPickTypeStepAccuracy={noop}
          onCancelPending={noop}
          onChooseKind={noop}
        />
      </StyledHoverCard>
    ) : null;

  const body = useMemo(() => {
    if (!selected) {
      return <StyledEmptyPanel>Select a location to geocode it.</StyledEmptyPanel>;
    }
    if (error) {
      return <StyledEmptyPanel>{error}</StyledEmptyPanel>;
    }
    if (isRunningForThis) {
      return (
        <GeocodingProgress
          stage={stage}
          sources={suggest.sources}
          candidates={suggest.candidates}
          seconds={seconds}
          name={name}
        />
      );
    }
    if (!response) {
      return (
        <StyledEmptyPanel>
          {`Run the engine to see where ${name} might be.`}
        </StyledEmptyPanel>
      );
    }
    if (!response.suggestions.length) {
      return (
        <StyledEmptyPanel>
          No gazetteer offered a location for this name. That is itself a result — record it below.
        </StyledEmptyPanel>
      );
    }

    const visible = showAll
      ? response.suggestions
      : response.suggestions.slice(0, VISIBLE_SUGGESTIONS);

    // the strongest score in this response, which is the only thing a score can
    // be read against - it means nothing next to another query's

    return visible.map((suggestion, index) => {
      const pendingHere = pending?.index === index ? pending : null;
      return (
        <SuggestionCard
          key={`${suggestion.lat}-${suggestion.lon}-${index}`}
          suggestion={suggestion}
          index={index}
          total={response.suggestions.length}
          topScore={topScore}
          mergeRadiusKm={response.mergeRadiusKm}
          band={band}
          roles={roles}
          pendingHere={pendingHere}
          highlighted={highlighted === index}
          onHover={(on) => onHoverCard?.(on ? index : null)}
          accuracyMenuOpen={accuracyMenu === index}
          menuAnchor={menuAnchor}
          allMatches={expandedMatches.has(index)}
          onToggleMatches={() =>
            setAllMatches((current) => {
              const next = new Set(current);
              next.has(index) ? next.delete(index) : next.add(index);
              return next;
            })
          }
          onShowOnMap={onShowOnMap}
          onUseAs={(accuracy, anchor) => chooseAccuracy(index, suggestion, accuracy, anchor)}
          onOpenAccuracyMenu={(anchor) => {
            setMenuAnchor(anchor);
            setAccuracyMenu(index);
          }}
          onCloseAccuracyMenu={() => setAccuracyMenu(null)}
          onPickTypeStepAccuracy={(accuracy, anchor) =>
            chooseAccuracy(index, suggestion, accuracy, anchor)
          }
          onCancelPending={() => setPending(null)}
          onChooseKind={(accuracy, placeType) => accept(suggestion, accuracy, placeType)}
        />
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selected,
    response,
    isRunningForThis,
    error,
    name,
    stage,
    seconds,
    suggest.sources,
    pending,
    accuracyMenu,
    menuAnchor,
    showAll,
    expandedMatches,
    roles,
    context,
    band,
    highlighted,
    onHoverCard,
  ]);

  return (
    <StyledSuggestionsPanel>
      {/* the question, before anything that answers it: the criteria a
          suggestion is judged against belong beside the suggestion, and a
          coastal town in Portugal reads as plausible until "region: europe"
          is on screen next to it */}
      <GeocodingContextPanel
        context={context}
        projectContext={projectContext}
        onChange={onContextChange}
        onLanguagesChange={onContextLanguages}
        onWeightChange={onContextWeight}
        onReset={onContextReset}
        onRegeocode={
          answerIsStale && selected
            ? () => suggest.run(selected.entity.id, name, context)
            : undefined
        }
      />
      <StyledPanelHead>
        {/* the name and what is recorded against it are one statement: the
            panel is about this Location, and whether it already has a
            coordinate is the first thing that decides what to do next */}
        <StyledTargetLine>
          <StyledTarget>{selected ? name : "No location selected"}</StyledTarget>
          {selected ? (
            <StyledCurrent>
              {selected.isGeocoded
                ? `${selected.lat?.toFixed(4)}, ${selected.lon?.toFixed(4)} · ${selected.accuracy}`
                : "not geocoded"}
            </StyledCurrent>
          ) : null}
        </StyledTargetLine>
        {selected?.isGeocoded && onRetype ? (
          <StyledRetype>
            {/* the kind of place is corrected far more often than the coordinate
                is, and re-running the engine to change one word would throw away
                a coordinate somebody already judged */}
            <StyledTypeStepAside>kind of place</StyledTypeStepAside>
            <StyledRetypeButton
              type="button"
              $unset={!selected.placeType}
              onClick={(event) => {
                const box = event.currentTarget.getBoundingClientRect();
                setPickingHead({ left: box.left, top: box.top, bottom: box.bottom });
              }}
            >
              <PlaceTypeIcon placeType={selected.placeType} />
              {placeTypeInfo(selected.placeType).label}
            </StyledRetypeButton>
          </StyledRetype>
        ) : null}

        {pickingHead && onRetype ? (
          <PlaceTypePicker
            anchor={pickingHead}
            roles={roles}
            current={selected?.placeType}
            clearLabel="record no kind of place"
            onChoose={(placeType) => {
              onRetype(placeType as GeocodingPlaceType | null);
              setPickingHead(null);
            }}
            onClose={() => setPickingHead(null)}
          />
        ) : null}
        {/* with nothing selected the bar holds one control that can never be
            pressed, drawn in the shared disabled grey that all but disappears
            on this panel — and the empty state below already says what to do */}
        {selected ? (
        <StyledRunBar>
          {/* the same run either way, named for what it does: on a Location
              that already has a coordinate it is a re-check, and the coordinate
              it would replace is on the line above */}
          <Button
            label={selected?.isGeocoded ? "geocode again" : "geocode"}
            icon={<IcoGeocode />}
            color="primary"
            tooltipLabel={
              selected?.isGeocoded
                ? "ask the engine again — the coordinate it has now is kept until you accept another"
                : undefined
            }
            disabled={!engineReady || isRunningForThis}
            onClick={() => suggest.run(selected.entity.id, name, context)}
          />
          {isRunningForThis ? (
            <Button label="cancel" color="danger" onClick={suggest.cancel} />
          ) : null}
          <StyledRunFacts>
            <StyledProgress>
              {!isRunningForThis && response
                ? `${response.suggestions.length} suggestions · margin ${
                    response.margin == null ? "—" : response.margin.toFixed(2)
                  } · ${timing(response)}`
                : null}
            </StyledProgress>
            {/* what the engine actually searched for, said once beside the
                button that asked it. Per card it was the same few names
                repeated down the list, answering a question about the run
                rather than about the place */}
            {!isRunningForThis && response?.query.candidates?.length ? (
              <StyledSearched>
                searched{" "}
                {response.query.candidates.map((candidate, index) => (
                  <span key={`${candidate.name}-${index}`}>
                    {index ? ", " : ""}
                    <strong>{candidate.name}</strong> ({candidate.nameFit.toFixed(2)})
                  </span>
                ))}
              </StyledSearched>
            ) : null}
          </StyledRunFacts>
        </StyledRunBar>
        ) : null}
      </StyledPanelHead>

      {degradations.length ? (
        <>
          <StyledDegraded
            ref={setDegradedAnchor}
            tabIndex={0}
            onMouseEnter={() => setDegradedHovered(true)}
            onMouseLeave={() => setDegradedHovered(false)}
            onFocus={() => setDegradedHovered(true)}
            onBlur={() => setDegradedHovered(false)}
          >
            <StyledDegradedIcon aria-hidden="true">
              <IcoWarning />
            </StyledDegradedIcon>
            <span aria-hidden="true">partial answer</span>
            <StyledDegradedFullText>{degradedSummary}</StyledDegradedFullText>
          </StyledDegraded>
          <Tooltip
            visible={degradedHovered}
            referenceElement={degradedAnchor}
            position="bottom-start"
            content={
              <StyledDegradedTip>
                {/* the engine answers 200 for these, and a request that skipped
                    its language-model stages comes back sooner rather than
                    later */}
                <strong>This answer was computed with parts of the pipeline missing.</strong>
                <ul>
                  {degradations.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
                Running it again is usually enough — the causes are transient.
              </StyledDegradedTip>
            }
          />
        </>
      ) : null}

      {/* a run of several seconds that then finishes silently leaves anyone
          not watching the panel with no idea it is done */}
      <StyledLiveRegion aria-live="polite">
        {isRunningForThis
          ? `Querying gazetteers for ${name}.`
          : response
            ? `${response.suggestions.length} suggestions for ${name}.`
            : ""}
      </StyledLiveRegion>

      {/* a list of things to choose between, which is what it is and what the
          Locations list beside it already announces itself as */}
      <StyledSuggestionList aria-label="Suggestions">
        {body}
        {hoveredCard}
        {response && !showAll && response.suggestions.length > VISIBLE_SUGGESTIONS ? (
          <StyledShowMore type="button" onClick={onShowAll}>
            show the remaining {response.suggestions.length - VISIBLE_SUGGESTIONS} suggestions
          </StyledShowMore>
        ) : null}
      </StyledSuggestionList>

      {response?.sources.length ? (
        <StyledSourceReport>
          {/* the tally answers "does this absence mean anything" on its own most
              of the time; the sixteen lines behind it settle the rest */}
          <StyledSourceHead
            type="button"
            aria-expanded={showSources}
            onClick={() =>
              setShowSources((current) => {
                localStorage.setItem(SOURCES_KEY, current ? "no" : "yes");
                return !current;
              })
            }
          >
            <StyledSourceCaret $open={showSources}>
              <IcoChevronDown />
            </StyledSourceCaret>
            <span>
              {sourceTally.total} sources · {sourceTally.ran} ran
              {sourceTally.skipped ? ` · ${sourceTally.skipped} skipped` : ""}
            </span>
            {sourceTally.failed ? (
              <StyledSourceFailed>{sourceTally.failed} failed</StyledSourceFailed>
            ) : null}
          </StyledSourceHead>
          {showSources ? (
          <StyledSourceLines>
          {[...response.sources]
            // ran first, then what was skipped, then what broke: a researcher
            // reads this to decide whether an absence means anything
            .sort((a, b) => a.status.localeCompare(b.status))
            .map((source) => (
              <StyledSourceLine key={source.name} $status={source.status}>
                {source.name} · {source.status}
                {/* a partial count is a floor, and a benched source is one that
                    comes back on its own — neither is visible in the status */}
                {source.benched ? " (benched, back shortly)" : ""}
                {source.status === "ran"
                  ? ` · ${source.count} found${source.partial ? ", incomplete" : ""}`
                  : ""}
                {source.reason ? ` · ${source.reason}` : ""}
              </StyledSourceLine>
            ))}
          </StyledSourceLines>
          ) : null}
        </StyledSourceReport>
      ) : null}

      {response ? (
        <StyledReject>
          <Button label="none of these" color="warning" onClick={reject} />
          <Dropdown.Single.Basic
            width={160}
            ariaLabel="why none of these fits"
            options={REASONS}
            value={reason}
            onChange={(value) => setReason(value as FeedbackReason)}
          />
          <Input
            value={note}
            onChangeFn={setNote}
            placeholder="note (optional)"
            changeOnType
            width="full"
          />
        </StyledReject>
      ) : null}
    </StyledSuggestionsPanel>
  );
};
