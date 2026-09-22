import {
  GeocodingAccuracy,
  GeocodingBbox,
  GeocodingPlaceType,
  IGeocodingContext,
  IGeocodingContextWeights,
} from "@inkvisitor/shared/types/geocoding";
import { IUserOptions } from "@inkvisitor/shared/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, Panel } from "components";
import { LayoutSeparatorVertical } from "components/advanced";
import { useUserQuery } from "hooks/react-query/useUserQuery";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { ENGINE_URL, engineHealth } from "./engine";
import { fixtureModeAvailable, isFixtureMode, setFixtureMode } from "./fixtureMode";
import {
  QUERY_FIELDS,
  QueryField,
  SingleQueryField,
  UNSET,
  contextLanguages,
} from "./geocodingContextFields";
import { GeocodingList } from "./GeocodingList";
import { MapFocus, nextFocus } from "./mapFocus";
import { bandOf } from "./suggestionRank";
import { isTaken, quickPick } from "./quickGeocode";
import { BatchRun, BatchStep, batchStarting, choicesFrom, withStep } from "./geocodingBatch";
import { Suggestion } from "./engineTypes";
import { scatterOf } from "./suggestionScatter";
import { GeocodingBatchModal } from "./GeocodingBatchModal";
import { provenanceOf } from "./suggestionProvenance";
import { GeocodingActivityModal } from "./GeocodingActivityModal";
import { GeocodingContextModal } from "./GeocodingContextModal";
import { GeocodingOverwriteModal } from "./GeocodingOverwriteModal";
import { GeocodingMap } from "./GeocodingMap";
import { GeocodingSuggestions, VISIBLE_SUGGESTIONS } from "./GeocodingSuggestions";
import { StyledEngineDot, StyledEngineLabel, StyledEngineStatus } from "./GeocodingPageStyles";
import { EngineState } from "./types";
import { useGeocodingBrowse } from "./useGeocodingBrowse";
import { useGeocodingConfig } from "./useGeocodingConfig";
import { useGeocodingPanels } from "./useGeocodingPanels";
import { GeocodingLocation } from "./useGeocodingLocations";
import { useGeocodingSuggest } from "./useGeocodingSuggest";
import { useGeocodingWriter } from "./useGeocodingWriter";

/**
 * How long after the last movement of a weight slider it is written.
 *
 * Long enough that one drag is one write, short enough that letting go and
 * pressing regeocode saves what is being asked about.
 */
const WEIGHT_SAVE_DELAY_MS = 400;

export const GeocodingPage: React.FC = () => {
  const contentHeight: number = useAppSelector((state) => state.layout.contentHeight);

  const {
    roles,
    context: stored,
    projectContext,
    isConfigured,
    missingRoles,
  } = useGeocodingConfig();
  const { data: user } = useUserQuery();
  const queryClient = useQueryClient();

  /**
   * The context every request from this page is sent with.
   *
   * A local copy of the resolved one, so a field changed in the Suggestions
   * panel reaches the engine on the next press rather than after a round trip.
   * The write below is what makes it last.
   *
   * Re-seeded on the values rather than on the object, because the resolved
   * context is recomputed on every background refetch of the settings and the
   * user; keyed on identity, each of those would throw away a change the write
   * had not yet confirmed.
   */
  const storedKey = JSON.stringify(stored);
  const [context, setContext] = useState<IGeocodingContext>(stored);
  useEffect(() => setContext(JSON.parse(storedKey) as IGeocodingContext), [storedKey]);

  /**
   * Saves the query context as this researcher's own defaults.
   *
   * A partial patch: the user store merges nested objects, so writing one field
   * leaves every sibling option alone — and the response user carries a
   * narrower options shape than the stored one, so spreading it back would drop
   * what it omits.
   *
   * An empty value is stored rather than removed, because that is what the
   * layering reads as "nothing said here" — which is how a cleared field lets
   * the project's own value through.
   */
  const saveContext = useMutation({
    mutationFn: async (patch: IGeocodingContext) => {
      if (!user) {
        return;
      }
      await api.usersUpdate(user.id, {
        options: { geocoding: { context: patch } } as unknown as IUserOptions,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user"] }),
    onError: () => toast.error("Your geocoding context could not be saved."),
  });

  const setContextField = (field: SingleQueryField, value: string) => {
    // a named region and a hand-drawn box are two answers to the same question,
    // and the engine refuses a request carrying both — so naming a region drops
    // whatever was drawn rather than leaving an area nothing will send
    const patch: IGeocodingContext =
      field === "region"
        ? ({ region: value, regionBbox: null } as IGeocodingContext)
        : ({ [field]: value } as IGeocodingContext);
    setContext((current) => ({
      ...current,
      ...patch,
      [field]: value || (projectContext[field] ?? undefined),
    }));
    saveContext.mutate(patch);
  };

  /**
   * The languages the name being searched for is stated to be in.
   *
   * Written as a list on its own field. The single-value field a context saved
   * earlier still carries is read underneath it and never written, so clearing
   * the list here falls back to the project's answer in whichever shape the
   * project stored it.
   */
  const setContextLanguages = (values: string[]) => {
    setContext((current) => ({
      ...current,
      languages: values.length ? values : contextLanguages(projectContext),
      language: undefined,
    }));
    saveContext.mutate({ languages: values });
  };

  /**
   * How much one of the four dimensions counts when the engine weighs sources.
   *
   * The slider reports every position it passes through, so the save waits for
   * the drag to stop. Each tick saved on its own would put a dozen writes of
   * the same field in flight at once, and each one's success refetches the user
   * and re-seeds this context — so whichever reply landed last, not whichever
   * position was released on, would be the one that stuck.
   */
  const weightSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Every weight moved since the last write, held together.
   *
   * The wait is one wait rather than one per dimension, so moving a second
   * slider before the first has been written must not cancel the first — it
   * accumulates instead, and the four dimensions go out as the single patch
   * they belong in.
   */
  const pendingWeights = useRef<IGeocodingContextWeights>({});
  useEffect(() => () => {
    if (weightSave.current) {
      clearTimeout(weightSave.current);
    }
  }, []);
  const setContextWeight = (field: QueryField, weight: number) => {
    setContext((current) => ({
      ...current,
      contextWeights: { ...current.contextWeights, [field]: weight },
    }));
    pendingWeights.current = { ...pendingWeights.current, [field]: weight };
    if (weightSave.current) {
      clearTimeout(weightSave.current);
    }
    weightSave.current = setTimeout(() => {
      const contextWeights = pendingWeights.current;
      pendingWeights.current = {};
      saveContext.mutate({ contextWeights });
    }, WEIGHT_SAVE_DELAY_MS);
  };

  /**
   * The area drawn on the map, or its removal.
   *
   * Kept beside the named region rather than replacing it: a box drawn for one
   * awkward place is often temporary, and dropping it should give back whatever
   * region was named before, which `regionValue` and `regionToSend` both read
   * off the stored name.
   */
  const setRegionBox = (box: GeocodingBbox | null) => {
    setContext((current) => ({ ...current, regionBbox: box }));
    saveContext.mutate({ regionBbox: box });
  };

  /** Drops every personal query value, so all four fall back to the project's. */
  const resetContext = () => {
    setContext((current) => ({
      ...current,
      ...Object.fromEntries(
        QUERY_FIELDS.filter((field) => field !== "language").map((field) => [
          field,
          projectContext[field],
        ]),
      ),
      languages: contextLanguages(projectContext),
      // the single-value field is read only where `languages` says nothing, and
      // the line above has just given it the project's answer
      language: undefined,
      regionBbox: projectContext.regionBbox ?? null,
      contextWeights: projectContext.contextWeights,
    }));
    saveContext.mutate({
      // `language` is deliberately absent: it is the single-value field a
      // context saved earlier still carries, read underneath `languages` and
      // written by nothing — a reset that blanked it would be this page writing
      // the very key it stopped writing
      ...(Object.fromEntries(
        QUERY_FIELDS.filter((field) => field !== "language").map((field) => [field, UNSET]),
      ) as IGeocodingContext),
      languages: [],
      regionBbox: null,
      // the stored options are merged rather than replaced, so a weight is
      // dropped by writing nothing over it rather than by leaving it out
      contextWeights: Object.fromEntries(
        QUERY_FIELDS.map((field) => [field, null]),
      ) as IGeocodingContext["contextWeights"],
    });
  };

  // page-scoped, so it lives here rather than in redux - the list, the map and
  // the suggestions all sit under this component
  const [selected, setSelected] = useState<GeocodingLocation | undefined>(undefined);

  const browse = useGeocodingBrowse(roles);
  const panels = useGeocodingPanels();

  /**
   * The Locations a bulk action applies to.
   *
   * A second state beside the selection, never the same one: the map and the
   * Suggestions panel answer about exactly one place, so the cursor cannot be a
   * set — and marking a row must not move what they are answering about.
   */
  const [marked, setMarked] = useState<Set<string>>(() => new Set());

  const mark = (ids: string[], on: boolean) =>
    setMarked((current) => {
      const next = new Set(current);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  // a set assembled against filters the list no longer holds is a set nobody can
  // see, and an action over it would reach rows that scrolled out of existence
  const filterKey = JSON.stringify(browse.filters);
  useEffect(() => setMarked(new Set()), [filterKey]);

  /** What a bulk write is doing, while it is doing it. */
  const [bulk, setBulk] = useState<string | undefined>(undefined);

  /**
   * Set while a run should stop after the write in flight.
   *
   * A ref rather than state: the loop reads it between writes, and a state
   * update the loop is not re-rendered by would never reach it. The write
   * already under way is left to finish - abandoning it half-written is a
   * worse outcome than one more Location than was asked for.
   */
  const cancelBulk = useRef(false);

  /** What one write does for itself, done once for a run of them. */
  const refreshLocations = () => {
    queryClient.invalidateQueries({ queryKey: ["geocoding-locations"] });
    queryClient.invalidateQueries({ queryKey: ["geocoding-values"] });
  };

  /**
   * Records one kind of place across the marked set.
   *
   * Sequential rather than parallel: each write is a read-modify-write of one
   * entity through the same path a single retype takes, and the first refusal
   * stops the run — every row carries the same kind, so a project with no
   * Concept for it refuses all of them and forty toasts say it forty times.
   */
  const retypeMarked = async (placeType: GeocodingPlaceType | null) => {
    const targets = browse.all.filter(
      (location) => marked.has(location.entity.id) && location.isGeocoded,
    );
    cancelBulk.current = false;
    let done = 0;
    for (const location of targets) {
      setBulk(`${done + 1} of ${targets.length}`);
      if (!(await retype(location, placeType, { quiet: true }))) {
        setBulk(undefined);
        refreshLocations();
        toast.error(`Stopped after ${done} of ${targets.length}. The rest were not written.`);
        return;
      }
      done += 1;
      if (cancelBulk.current) {
        setBulk(undefined);
        // what was written stays written, and what it was written on stays
        // marked, so the run can be finished rather than started again
        setMarked((current) => {
          const next = new Set(current);
          targets.slice(0, done).forEach((written) => next.delete(written.entity.id));
          return next;
        });
        refreshLocations();
        toast.info(`Stopped after ${done} of ${targets.length}. The rest are still marked.`);
        return;
      }
    }
    setBulk(undefined);
    setMarked(new Set());
    // one refetch for the run, since each write held its own back
    refreshLocations();
    toast.success(
      done === 1
        ? "Kind of place recorded on one Location."
        : `Kind of place recorded on ${done} Locations.`,
    );
  };

  /**
   * The next Location still wanting a coordinate, skipping the one being written.
   *
   * Chosen before the write rather than after: the row moves to the end of the
   * geocoded group as soon as its coordinate lands, so an index taken afterwards
   * points at a different place in the list.
   */
  const nextToDo = (writingId: string) =>
    browse.visible.find(
      (location) => !location.isGeocoded && location.entity.id !== writingId,
    );

  /**
   * Runs a write and moves on.
   *
   * Moving on means the next Location with no coordinate, which is the row that
   * has just risen to the top of that group — the researcher works down from
   * there while what they finished sits directly above the boundary.
   */
  const writeAndAdvance = async (input: Parameters<typeof write>[0]) => {
    const next = nextToDo(input.location.id);
    if (await write(input)) {
      browse.markWritten(input.location.id);
      setSelected(next);
      return;
    }
    // a write held for confirmation advances when it is confirmed, and the
    // successor has to be the one chosen before the list moved
    advanceTo.current = next;
  };

  /**
   * Geocodes one Location without anybody reading the run.
   *
   * The whole act: ask the engine, decide from the answer, write it. Every part
   * is one the panel already does, and this is the same three in a row with the
   * reading taken out — which is why the decision is a function rather than
   * something written here, and why the accuracy comes off the sources rather
   * than off a preference.
   *
   * Reports what it did rather than showing it: a quick geocode is used because
   * the researcher does not want to look, and the one thing they need back is
   * whether it wrote or why it did not.
   */
  const quickGeocodeOne = async (
    location: GeocodingLocation,
    options: { quiet?: boolean } = {},
  ): Promise<{
    written: boolean;
    skipped?: string;
    choices?: Suggestion[];
    /**
     * The radius this run's matches were grouped within, so a choice made
     * afterwards is judged against the same distance the run judged it by.
     */
    mergeRadiusKm?: number;
    taken?: { suggestion: Suggestion; accuracy: GeocodingAccuracy };
  }> => {
    const name = location.entity.labels[0];
    if (!name || !user?.options) {
      return { written: false, skipped: "the Location has no name to search for" };
    }
    const response = await suggest.run(location.entity.id, name, context);
    const pick = quickPick(response, {
      strategy: context.quickStrategy ?? "clearWinner",
      takeOffRegion: context.quickTakeOffRegion,
    });
    if (!isTaken(pick)) {
      // handed back with the refusal, so the decision it declined to make can be
      // made afterwards without asking the engine the same question again
      return {
        written: false,
        skipped: pick.skip,
        choices: choicesFrom(response?.suggestions ?? []),
        // carried with the choices: a spread only means something against the
        // distance the engine was willing to merge, which comes from the kind
        // of place rather than from a constant
        mergeRadiusKm: response?.mergeRadiusKm,
      };
    }
    const written = await write(
      {
        location: location.entity,
        roles,
        lat: pick.take.lat,
        lon: pick.take.lon,
        accuracy: pick.accuracy,
        // the same rule every other path follows: a kind is written only where
        // the corpus named one to stand for all of them, and never guessed at
        placeType: context.recordPlaceType === false ? (context.defaultPlaceType ?? undefined) : undefined,
        provenance: provenanceOf(pick.take),
        current: location,
        userOptions: user.options,
      },
      // a quick geocode is the answer to "geocode this", and stopping to ask
      // whether it may replace what is there turns one gesture into two —
      // asked of a run of ninety, into ninety
      { quiet: options.quiet, confirmed: true },
    );
    if (written) {
      browse.markWritten(location.entity.id);
    }
    return { written, taken: { suggestion: pick.take, accuracy: pick.accuracy } };
  };

  /** The Location a quick geocode is running on, which its row draws as busy. */
  const [quickBusy, setQuickBusy] = useState<string | null>(null);

  /**
   * The row's own quick action.
   *
   * One Location, and nothing kept about it afterwards. It shares the deciding
   * and the writing with a batch and none of the bookkeeping: a record of steps
   * and a window over it exist so that ninety answers can be read after the
   * fact, and one answer wants telling, not filing.
   *
   * So the row says it is working and a toast says how it went. A refusal opens
   * the Location when the toast is clicked, because a refusal is the outcome
   * that leaves something to do, and the run behind it is one the engine will
   * answer again from its cache.
   */
  const quickGeocode = async (location: GeocodingLocation) => {
    const label = location.entity.labels[0] || location.entity.id;
    // one toast per Location, replaced rather than stacked: a row clicked twice
    // is one question asked twice, and two toasts saying so bury the rows below
    const toastId = `quick-geocode-${location.entity.id}`;
    setQuickBusy(location.entity.id);
    // the writer's own success line is held back and this one says it instead:
    // "coordinate saved" and where it was saved to are the same news, and the
    // second is the one worth reading. Holding it back also holds back the
    // refetch, which is asked for here once the answer is in
    const result = await quickGeocodeOne(location, { quiet: true });
    setQuickBusy(null);
    suggest.clear();
    if (result.written && result.taken) {
      const { suggestion, accuracy } = result.taken;
      refreshLocations();
      toast.success(
        `${label} — ${suggestion.lat.toFixed(4)}, ${suggestion.lon.toFixed(4)} · ${accuracy}`,
        { toastId },
      );
      return;
    }
    toast.warn(
      `${label} was left for you: ${result.skipped ?? "the engine gave no answer"}. Click to open it.`,
      { toastId, onClick: () => setSelected(location) },
    );
  };

  /**
   * Writes a suggestion the researcher picked out of the run's own window.
   *
   * The step is marked written from here rather than re-run, because the run
   * already asked and this is the answer to the question it declined to settle.
   */
  const assignFromBatch = async (step: BatchStep, suggestion: Suggestion) => {
    const location = browse.all.find((one) => one.entity.id === step.id);
    if (!location || !user?.options) {
      return;
    }
    // the same reading the card leads with and a quick geocode writes: how
    // precisely a coordinate locates is a fact about the sources
    const accuracy = scatterOf(suggestion, step.mergeRadiusKm).leadAccuracy;
    const written = await write(
      {
        location: location.entity,
        roles,
        lat: suggestion.lat,
        lon: suggestion.lon,
        accuracy,
        placeType:
          context.recordPlaceType === false ? (context.defaultPlaceType ?? undefined) : undefined,
        provenance: provenanceOf(suggestion),
        current: location,
        userOptions: user.options,
      },
      { quiet: true, confirmed: true },
    );
    if (!written) {
      return;
    }
    browse.markWritten(step.id);
    setMarked((current) => {
      const next = new Set(current);
      next.delete(step.id);
      return next;
    });
    // the refusal's reason goes with the refusal: it says why nothing was
    // written, and something has now been written
    setBatch((run) =>
      withStep(run, step.id, "written", { taken: { suggestion, accuracy }, note: undefined }),
    );
    refreshLocations();
  };

  /**
   * Geocodes every marked Location that has no coordinate.
   *
   * Sequential, and stopped the same way the kind-of-place run is: one request
   * is in flight at a time because the engine's own progress stream reports one,
   * and because a researcher watching a hundred of these wants to be able to
   * stop after the third.
   *
   * Every marked Location, including the ones that already have a coordinate.
   * Re-geocoding is the point of running it over those: the engine's answer has
   * moved on, or the context has, and what is recorded should follow. The write
   * would otherwise stop to ask before replacing each one, so the run says in
   * advance that it has been asked — and what each Location previously held is
   * kept in this browser's write history, which is where a replaced coordinate
   * can still be read.
   */
  const geocodeMarked = async () => {
    const targets = browse.all.filter((location) => marked.has(location.entity.id));
    cancelBulk.current = false;
    // built whole before the first request, so the window that reports on the
    // run has its full list from the first frame rather than growing a row at a
    // time under the eye
    setBatch(
      batchStarting(
        targets.map((one) => ({
          id: one.entity.id,
          label: one.entity.labels[0] || one.entity.id,
        })),
      ),
    );
    setShowBatch(true);
    const done: string[] = [];
    for (const [index, location] of targets.entries()) {
      setBulk(`${index + 1} of ${targets.length}`);
      setBatch((run) => withStep(run, location.entity.id, "running"));
      const result = await quickGeocodeOne(location, { quiet: true });
      if (result.written) {
        done.push(location.entity.id);
        setBatch((run) => withStep(run, location.entity.id, "written", { taken: result.taken }));
      } else {
        setBatch((run) =>
          withStep(run, location.entity.id, result.skipped ? "skipped" : "failed", {
            note: result.skipped,
            choices: result.choices,
            mergeRadiusKm: result.mergeRadiusKm,
          }),
        );
      }
      if (cancelBulk.current) {
        break;
      }
    }
    const written = done.length;
    setBulk(undefined);
    // opened again at the end whether or not it was watched: the run's whole
    // point is not having to watch it, and its verdict is what was being waited
    // for
    setBatch((run) => run && { ...run, done: true, stopped: cancelBulk.current });
    setShowBatch(true);
    suggest.clear();
    // what was written is unmarked and everything else stays marked, so the set
    // left behind is exactly the Locations still wanting a person — including
    // the ones a stopped run never reached
    setMarked((current) => {
      const next = new Set(current);
      done.forEach((id) => next.delete(id));
      return next;
    });
    refreshLocations();
    // no toast: the window says all of this, per Location, and a line saying it
    // again over the top of it is the same news twice
  };

  /**
   * A point the researcher asked to see on the map. Carries when it was asked
   * so that asking twice for the same suggestion moves the map twice.
   */
  const [focus, setFocus] = useState<MapFocus | null>(null);

  /**
   * Whether the whole list is shown rather than its strongest few.
   *
   * Here rather than in the panel because the map draws the same suggestions:
   * a card numbered 7 against six markers numbers nothing.
   */
  const [showAll, setShowAll] = useState(false);

  // a fresh Location brings its own list, whose length the last one says nothing
  // about
  useEffect(() => setShowAll(false), [selected?.entity.id]);

  /**
   * A suggestion accepted by clicking its marker, with both questions answered.
   *
   * The map asks them, over the marker, and the panel carries the answer out —
   * so accepting from the map reports the same choice to the engine as
   * accepting from the card, and only one place knows what that report is.
   *
   * `at` is what makes accepting the same suggestion twice happen twice: the
   * pair of answers can repeat, and an effect keyed on the value alone would
   * see the second acceptance as no change at all.
   */
  const [chosenOnMap, setChosenOnMap] = useState<{
    index: number;
    accuracy: GeocodingAccuracy;
    placeType?: GeocodingPlaceType | null;
    at: number;
  } | null>(null);
  const mapChoices = useRef(0);

  /**
   * The run over the marked set, and whether its window is open.
   *
   * Two states because they are two facts. The run outlives the window — closing
   * it must not stop the work — and the window outlives the run, because the
   * verdict is what the whole thing was for.
   */
  const [batch, setBatch] = useState<BatchRun | null>(null);
  const [showBatch, setShowBatch] = useState(false);

  /**
   * The suggestion the pointer is on, and which side of the page it is on.
   *
   * Two states rather than one, because they do not mean the same thing: the
   * map's hover also opens the card that describes the mark, and the list's must
   * not. What both feed is one index — the thing being pointed at — which the
   * map rings and the list rules.
   */
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  /**
   * Selecting one of the other Locations drawn on the map.
   *
   * Held stable across renders: the map registers its click handler once per
   * change of this function, and a fresh one on every render of this page would
   * tear that listener down and rebuild it on every keystroke elsewhere.
   */
  /**
   * The suggestion the pointer is over on the map, and where on screen.
   *
   * Held by the page because the two panels that need it sit either side of it:
   * the map knows which mark, the suggestions panel holds the run the card is
   * drawn from.
   */
  const [hoveredSuggestion, setHoveredSuggestion] = useState<{
    index: number;
    at: { left: number; top: number };
  } | null>(null);

  /**
   * How long the hovered card survives the pointer leaving its mark.
   *
   * Long enough to reach it. The card sits beside the mark rather than on it, so
   * the pointer crosses bare map on the way — and the map reports that as
   * hovering nothing, which would close the card being reached for.
   */
  const HOVER_GRACE_MS = 260;
  const closeHover = useRef<number | null>(null);

  const hoverOnMap = useCallback(
    (index: number | null, at: { left: number; top: number } | null) => {
      if (closeHover.current !== null) {
        window.clearTimeout(closeHover.current);
        closeHover.current = null;
      }
      if (index === null || !at) {
        closeHover.current = window.setTimeout(
          () => setHoveredSuggestion(null),
          HOVER_GRACE_MS,
        );
        return;
      }
      setHoveredSuggestion({ index, at });
    },
    [],
  );

  /** The pointer is on the card itself, which keeps it open for as long as it stays. */
  const holdHover = useCallback((holding: boolean) => {
    if (closeHover.current !== null) {
      window.clearTimeout(closeHover.current);
      closeHover.current = null;
    }
    if (!holding) {
      setHoveredSuggestion(null);
    }
  }, []);

  const selectOnMap = useCallback(
    (entityId: string) => {
      const location = browse.geocoded.find((one) => one.entity.id === entityId);
      if (location) {
        setSelected(location);
      }
    },
    [browse.geocoded],
  );

  /** The map's hover wins: it is the one that also opened a card to be read. */
  const highlighted = hoveredSuggestion?.index ?? hoveredCard;

  const chooseOnMap = (
    index: number,
    accuracy: GeocodingAccuracy,
    placeType?: GeocodingPlaceType | null,
  ) => {
    mapChoices.current += 1;
    setChosenOnMap({ index, accuracy, placeType, at: mapChoices.current });
  };
  useEffect(() => setChosenOnMap(null), [selected?.entity.id]);

  /** Where to go once a held write is confirmed, chosen before the list changed. */
  const advanceTo = useRef<GeocodingLocation | undefined>(undefined);

  /**
   * Records what kind of place a Location is, leaving its coordinate alone.
   *
   * The coordinate and accuracy are written back unchanged because the write
   * replaces every role it owns, and a partial one would leave a Location with a
   * kind and no longitude. A Location with no coordinate has nothing to write
   * against, so the mark on its row is a label rather than a control.
   */
  const retype = async (
    location: GeocodingLocation,
    placeType: GeocodingPlaceType | null,
    options?: { quiet?: boolean },
  ): Promise<boolean> => {
    if (!user?.options || location.lat == null || location.lon == null) {
      return false;
    }
    return write(
      {
        location: location.entity,
        roles,
        lat: location.lat,
        lon: location.lon,
        accuracy: location.accuracy || GeocodingAccuracy.Unknown,
        placeType,
        current: location,
        userOptions: user.options,
      },
      options,
    );
  };

  // `selected` is a snapshot taken when the row was clicked. After a write the
  // collection refetches, and under the default ungeocoded filter the row
  // leaves the list - so without re-syncing, the panel and the map keep showing
  // the pre-write state and the coordinate never visibly lands.
  useEffect(() => {
    if (!selected) {
      return;
    }
    const fresh = browse.all.find((location) => location.entity.id === selected.entity.id);
    if (fresh && fresh !== selected) {
      setSelected(fresh);
    }
  }, [browse.all, selected]);
  const { write, blocked, clearBlocked, pendingOverwrite, confirmOverwrite, cancelOverwrite } =
    useGeocodingWriter(roles);

  // a refused write says why. Without this the researcher cannot tell an accept
  // that worked from one the project's configuration silently rejected.
  useEffect(() => {
    if (blocked) {
      toast.error(blocked);
      clearBlocked();
    }
  }, [blocked, clearBlocked]);
  const suggest = useGeocodingSuggest();

  /**
   * The suggestion the engine separated from the rest, for the map's own mark.
   *
   * Decided from the run's margin, which the map is not given: the panel asks
   * the same question of the same response for its own star, and both are
   * reading one function rather than two rules that could drift apart.
   */
  const leader = useMemo(() => {
    const band = bandOf(suggest.response);
    return band?.clear ? 0 : null;
  }, [suggest.response]);

  const [showContext, setShowContext] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // the engine is a separate service that may not be deployed yet; every part of
  // this page except engine-driven suggestions works without it
  const { data: engineReachable, isFetching: checkingEngine } = useQuery({
    queryKey: ["geocoding-engine-health", ENGINE_URL],
    queryFn: ({ signal }) => engineHealth(signal),
    enabled: !!ENGINE_URL,
    refetchInterval: 60000,
  });

  const engineState: EngineState = !ENGINE_URL
    ? "unconfigured"
    : checkingEngine && engineReachable === undefined
      ? "checking"
      : engineReachable
        ? "up"
        : "down";

  const engineReady = engineState === "up" && isConfigured;

  /**
   * What the dot says, as opposed to what the engine is doing.
   *
   * An engine that answers while the project has assigned no Concepts is not a
   * page that works, and green would say it was — the state that used to be
   * spelled out beside the dot has to survive in the dot itself.
   */
  const engineDotState: EngineState =
    engineState === "up" && !isConfigured ? "unconfigured" : engineState;

  /**
   * Runs the engine as soon as a Location is selected, when the researcher has
   * asked for that. Skips a Location whose answer is already held or already on
   * its way, so re-selecting one does not re-query it.
   */
  useEffect(() => {
    if (!selected || !context.autoSearch || !engineReady) {
      return;
    }
    if (suggest.responseFor === selected.entity.id || suggest.runningFor === selected.entity.id) {
      return;
    }
    suggest.run(selected.entity.id, selected.entity.labels[0] || "", context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.entity.id, context.autoSearch, engineReady]);

  const engineLabel: Record<EngineState, string> = {
    unconfigured: "no engine address configured for this deployment",
    checking: "contacting the geocoding engine…",
    up: isConfigured
      ? `geocoding engine reachable at ${ENGINE_URL}`
      : `engine reachable — but no ${missingRoles.join(", ")} assigned yet`,
    down: `geocoding engine unreachable at ${ENGINE_URL} — manual assignment only`,
  };

  return (
    <>
      {/* Three panels rather than one holding a grid, the way MainPage composes
          its four. Box owns its own borders through the theme, which is also
          what stops the hairlines between panels reading as heavy ruled lines
          in dark mode. */}
      <Panel width={panels.listWidth} widthVarIndex={0}>
        <Box label="Locations" height={contentHeight}>
          <GeocodingList
            browse={browse}
            selectedId={selected?.entity.id}
            roles={roles}
            onSelect={setSelected}
            onRetype={retype}
            marked={marked}
            onMark={mark}
            onClearMarks={() => setMarked(new Set())}
            // absent while a write is in flight, which is what stops a second
            // run being started over the first
            onMarkedRetype={bulk ? undefined : retypeMarked}
            onMarkedGeocode={bulk ? undefined : geocodeMarked}
            batch={batch}
            onShowBatch={() => setShowBatch(true)}
            onDismissBatch={() => setBatch(null)}
            onQuickGeocode={quickGeocode}
            quickBusyId={quickBusy}
            quickStrategy={context.quickStrategy ?? "clearWinner"}
            markedProgress={bulk}
            onCancelMarkedRetype={() => {
              cancelBulk.current = true;
            }}
            engineReady={engineReady}
            onShowOnMap={(location) =>
              location.lat != null && location.lon != null
                ? setFocus((current) => nextFocus(current, location.lat as number, location.lon as number))
                : undefined
            }
            // selecting is what the rest of the page is gated on, so the row
            // becomes the subject before the engine is asked about it
            onGeocode={(location) => {
              setSelected(location);
              suggest.run(location.entity.id, location.entity.labels[0] || "", context);
            }}
          />
        </Box>
      </Panel>

      <LayoutSeparatorVertical
        separatorXPosition={panels.separators.list}
        resolveDrag={panels.resolveListDrag}
        setSeparatorXPosition={panels.setListSeparator}
      />

      <Panel width={panels.mapWidth} widthVarIndex={1}>
        <Box
          label="Map"
          height={contentHeight}
          /* the map is not a document: it owns its own viewport and pans
             within it, so it must never be given a scrollbar. The box's own
             scroller and the map's size are otherwise two things each deciding
             the other — a fractional height rounds up, a scrollbar appears, the
             narrower box resizes the canvas, and the height is recomputed */
          disableScroll
          headerComponent={
            <StyledEngineStatus title={engineLabel[engineState]}>
              {fixtureModeAvailable() ? (
                <Button
                  label={isFixtureMode() ? "recorded" : "live"}
                  color={isFixtureMode() ? "warning" : "success"}
                  tooltipLabel={
                    isFixtureMode()
                      ? "Serving a recorded response. Click for real gazetteer results."
                      : "Querying the gazetteers for real, 5-10s. Click for the recorded response."
                  }
                  onClick={() => setFixtureMode(!isFixtureMode())}
                />
              ) : null}
              <Button label="my preferences" color="greyer" onClick={() => setShowContext(true)} />
              <Button label="activity" color="greyer" onClick={() => setShowActivity(true)} />
              {/* a name and a colour, the way the header states the server's
                  own latency. The address, and what is wrong when something
                  is, are on the tooltip - they are read once, when the page
                  will not work, and never again */}
              <StyledEngineLabel>HGA engine</StyledEngineLabel>
              <StyledEngineDot $state={engineDotState} />
            </StyledEngineStatus>
          }
        >
          <GeocodingMap
            selected={selected}
            geocoded={browse.geocoded}
            context={context}
            userOptions={user?.options}
            engineReachable={engineState === "up"}
            suggestions={
              suggest.responseFor === selected?.entity.id
                ? (showAll
                    ? suggest.response?.suggestions
                    : suggest.response?.suggestions.slice(0, VISIBLE_SUGGESTIONS)) || []
                : []
            }
            roles={roles}
            focus={focus}
            onRegionBox={setRegionBox}
            onChooseSuggestion={chooseOnMap}
            onSelectLocation={selectOnMap}
            onHoverSuggestion={hoverOnMap}
            highlighted={highlighted}
            leader={leader}
            onAssign={(lat, lon, accuracy, placeType) => {
              if (!selected || !user?.options) {
                return;
              }
              writeAndAdvance({
                location: selected.entity,
                roles,
                lat,
                lon,
                accuracy,
                // an undecided kind of place keeps whatever the Location carries,
                // which is what a coordinate correction means
                placeType: placeType === undefined ? selected.placeType : placeType,
                current: selected,
                userOptions: user.options,
              });
            }}
          />
        </Box>
      </Panel>

      <LayoutSeparatorVertical
        separatorXPosition={panels.separators.suggestions}
        resolveDrag={panels.resolveSuggestionsDrag}
        setSeparatorXPosition={panels.setSuggestionsSeparator}
      />

      <Panel width={panels.suggestionsWidth} widthVarIndex={2}>
        <Box label="Suggestions" height={contentHeight}>
          <GeocodingSuggestions
            selected={selected}
            hovered={hoveredSuggestion}
            onHoldHover={holdHover}
            highlighted={highlighted}
            onHoverCard={setHoveredCard}
            roles={roles}
            context={context}
            projectContext={projectContext}
            onContextChange={setContextField}
            onContextLanguages={setContextLanguages}
            onContextWeight={setContextWeight}
            onContextReset={resetContext}
            userOptions={user?.options}
            suggest={suggest}
            engineReady={engineReady}
            onRetype={
              selected?.isGeocoded && user?.options
                ? (placeType) => retype(selected, placeType)
                : undefined
            }
            showAll={showAll}
            chosenOnMap={chosenOnMap}
            onShowAll={() => setShowAll(true)}
            onShowOnMap={(lat, lon) => setFocus((current) => nextFocus(current, lat, lon))}
            onAccept={(suggestion, accuracy, provenance, placeType) => {
              if (!selected || !user?.options) {
                return;
              }
              writeAndAdvance({
                location: selected.entity,
                roles,
                lat: suggestion.lat,
                lon: suggestion.lon,
                accuracy,
                // the researcher's answer, not the engine's: a suggestion often
                // carries no type, and the twelve are a judgement about the
                // place rather than a summary of what the sources called it
                placeType,
                provenance,
                current: selected,
                userOptions: user.options,
              });
            }}
          />
        </Box>
      </Panel>

      {showContext && user ? (
        <GeocodingContextModal
          userId={user.id}
          context={context}
          projectContext={projectContext}
          onClose={() => setShowContext(false)}
        />
      ) : null}
      {showActivity ? <GeocodingActivityModal onClose={() => setShowActivity(false)} /> : null}

      {batch && showBatch ? (
        <GeocodingBatchModal
          run={batch}
          onClose={() => setShowBatch(false)}
          onStop={
            batch.done
              ? undefined
              : () => {
                  cancelBulk.current = true;
                }
          }
          onAssign={assignFromBatch}
          onOpenLocation={(step) => {
            const location = browse.all.find((one) => one.entity.id === step.id);
            if (location) {
              setSelected(location);
            }
            // the panel is behind this window, so reading it means leaving
            setShowBatch(false);
          }}
        />
      ) : null}

      {pendingOverwrite ? (
        <GeocodingOverwriteModal
          pending={pendingOverwrite}
          onCancel={cancelOverwrite}
          onConfirm={async () => {
            if (await confirmOverwrite()) {
              setSelected(advanceTo.current);
            }
          }}
        />
      ) : null}
    </>
  );
};
