import {
  GeocodingAccuracy,
  IGeocodingContext,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { pointGeometry } from "@inkvisitor/shared/types/geometry";
import { useUserQuery } from "hooks/react-query/useUserQuery";
import React, { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "react-toastify";
import { QuickGeocodeToast } from "../components/recent/QuickGeocodeToast";
import { SuggestResponse, Suggestion } from "../types/engine";
import { engineSuggestStream } from "../utils/engine/engine";
import { buildSuggestQuery } from "../utils/engine/suggestQuery";
import { isTaken, quickPick } from "../utils/suggestions/quickGeocode";
import { provenanceOf } from "../utils/suggestions/suggestionProvenance";
import { scatterOf } from "../utils/suggestions/suggestionScatter";
import { BatchRun, BatchStep, batchStarting, choicesFrom, withStep } from "../utils/write/geocodingBatch";
import { GeocodingLocation } from "./useGeocodingLocations";
import { UseGeocodingWriter } from "./useGeocodingWriter";

/**
 * The runs over many Locations: a kind of place across the marked set, a quick
 * geocode of one row, and a batch geocode of the marked set.
 *
 * They share one rule about stopping and one way of deciding and writing, so
 * they live together; what each needs from the page is passed in rather than
 * reached for, which is what lets the page stay a layout of three panels.
 */

/** How long the notice of a quick geocode stays up, which is long enough to act on. */
const QUICK_TOAST_MS = 12_000;

interface UseGeocodingBulkInput {
  user: ReturnType<typeof useUserQuery>["data"];
  roles: IGeocodingRoles;
  context: IGeocodingContext;
  /** Every Location the page knows, which the marked ids are looked up in. */
  locations: GeocodingLocation[];
  markWritten: (id: string) => void;
  marked: Set<string>;
  setMarked: Dispatch<SetStateAction<Set<string>>>;
  write: UseGeocodingWriter["write"];
  /** Records a kind of place on one Location, leaving its geometry alone. */
  retype: (
    location: GeocodingLocation,
    placeType: string | null,
    options?: { quiet?: boolean },
  ) => Promise<boolean>;
  /** One refetch for a run, since each of its writes held its own back. */
  refresh: () => void;
  /** Drops the panel's answer, which a run over other Locations has left behind. */
  clearSuggestions: () => void;
  onSelect: (location: GeocodingLocation) => void;
  onShowOnMap: (lat: number, lon: number) => void;
}

export interface UseGeocodingBulk {
  /** What a bulk write is doing, while it is doing it. */
  bulk: string | undefined;
  batch: BatchRun | null;
  setBatch: Dispatch<SetStateAction<BatchRun | null>>;
  showBatch: boolean;
  setShowBatch: (show: boolean) => void;
  /** The Location a quick geocode is running on, which its row draws as busy. */
  quickBusy: string | null;
  stopBulk: () => void;
  retypeMarked: (placeType: string | null) => Promise<void>;
  quickGeocode: (location: GeocodingLocation) => Promise<void>;
  geocodeMarked: () => Promise<void>;
  assignFromBatch: (step: BatchStep, suggestion: Suggestion) => Promise<void>;
}

export const useGeocodingBulk = ({
  user,
  roles,
  context,
  locations,
  markWritten,
  marked,
  setMarked,
  write,
  retype,
  refresh,
  clearSuggestions,
  onSelect,
  onShowOnMap,
}: UseGeocodingBulkInput): UseGeocodingBulk => {
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
  /** The engine request a quick geocode or a batch step has in flight, so stopping a run can drop it. */
  const quickAbort = useRef<AbortController | null>(null);
  const stopBulk = () => {
    cancelBulk.current = true;
    quickAbort.current?.abort();
  };

  /**
   * Records one kind of place across the marked set.
   *
   * Sequential rather than parallel: each write is a read-modify-write of one
   * entity through the same path a single retype takes, and the first refusal
   * stops the run — every row carries the same kind, so a project with no
   * Concept for it refuses all of them and forty toasts say it forty times.
   */
  const retypeMarked = async (placeType: string | null) => {
    const targets = locations.filter(
      (location) => marked.has(location.entity.id) && location.isGeocoded,
    );
    cancelBulk.current = false;
    let done = 0;
    for (const location of targets) {
      setBulk(`${done + 1} of ${targets.length}`);
      if (!(await retype(location, placeType, { quiet: true }))) {
        setBulk(undefined);
        refresh();
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
        refresh();
        toast.info(`Stopped after ${done} of ${targets.length}. The rest are still marked.`);
        return;
      }
    }
    setBulk(undefined);
    setMarked(new Set());
    // one refetch for the run, since each write held its own back
    refresh();
    toast.success(
      done === 1
        ? "Kind of place recorded on one Location."
        : `Kind of place recorded on ${done} Locations.`,
    );
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
    /** Why the engine could not be asked or did not answer; the run is not "skipped", it failed. */
    error?: string;
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
    // asked on its own request rather than through the panel's, so a Location
    // the researcher opens meanwhile cannot abort this one, and an engine that
    // fails is told apart from one that found nothing
    const controller = new AbortController();
    quickAbort.current = controller;
    let response: SuggestResponse;
    try {
      response = await engineSuggestStream(
        buildSuggestQuery(name, context),
        () => undefined,
        () => undefined,
        controller.signal,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { written: false, skipped: "the run was stopped before this one was asked" };
      }
      return {
        written: false,
        error: err instanceof Error ? err.message : "The geocoding engine did not answer.",
      };
    } finally {
      if (quickAbort.current === controller) {
        quickAbort.current = null;
      }
    }
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
        choices: choicesFrom(response.suggestions),
        // carried with the choices: a spread only means something against the
        // distance the engine was willing to merge, which comes from the kind
        // of place rather than from a constant
        mergeRadiusKm: response.mergeRadiusKm,
      };
    }
    const written = await write(
      {
        location: location.entity,
        roles,
        geometry: pointGeometry(pick.take.lon, pick.take.lat),
        accuracy: pick.accuracy,
        // the same rule every other path follows: a kind is written only where
        // the corpus named one to stand for all of them, and never guessed at
        placeType:
          context.recordPlaceType === false ? (context.defaultPlaceType ?? undefined) : undefined,
        provenance: provenanceOf(pick.take),
        current: location.geometry,
        userOptions: user.options,
      },
      // a quick geocode is the answer to "geocode this", and stopping to ask
      // whether it may replace what is there turns one gesture into two —
      // asked of a run of ninety, into ninety
      { quiet: options.quiet, confirmed: true, suggestion: pick.take },
    );
    if (written) {
      markWritten(location.entity.id);
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
    clearSuggestions();
    if (result.written && result.taken) {
      const { suggestion, accuracy } = result.taken;
      refresh();
      const show = () => {
        onShowOnMap(suggestion.lat, suggestion.lon);
        toast.dismiss(toastId);
      };
      // held long enough to be read and used, and the whole notice is a way to
      // the map: the researcher has usually looked away by the time it lands
      toast.success(
        <QuickGeocodeToast
          label={label}
          suggestion={suggestion}
          accuracy={accuracy}
          onShow={show}
        />,
        { toastId, autoClose: QUICK_TOAST_MS, onClick: show },
      );
      return;
    }
    if (result.error) {
      toast.error(`${label} was not geocoded: ${result.error}`, { toastId });
      return;
    }
    toast.warn(
      `${label} was left for you: ${result.skipped ?? "the engine gave no answer"}. Click to open it.`,
      { toastId, onClick: () => onSelect(location) },
    );
  };

  /**
   * Writes a suggestion the researcher picked out of the run's own window.
   *
   * The step is marked written from here rather than re-run, because the run
   * already asked and this is the answer to the question it declined to settle.
   */
  const assignFromBatch = async (step: BatchStep, suggestion: Suggestion) => {
    const location = locations.find((one) => one.entity.id === step.id);
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
        geometry: pointGeometry(suggestion.lon, suggestion.lat),
        accuracy,
        placeType:
          context.recordPlaceType === false ? (context.defaultPlaceType ?? undefined) : undefined,
        provenance: provenanceOf(suggestion),
        current: location.geometry,
        userOptions: user.options,
      },
      { quiet: true, confirmed: true },
    );
    if (!written) {
      return;
    }
    markWritten(step.id);
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
    refresh();
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
    const targets = locations.filter((location) => marked.has(location.entity.id));
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
            note: result.skipped ?? result.error,
            choices: result.choices,
            mergeRadiusKm: result.mergeRadiusKm,
          }),
        );
      }
      // an engine that is down is down for every Location after this one, and
      // asking ninety more would file ninety identical failures
      if (cancelBulk.current || result.error) {
        break;
      }
    }
    setBulk(undefined);
    // opened again at the end whether or not it was watched: the run's whole
    // point is not having to watch it, and its verdict is what was being waited
    // for
    setBatch((run) => run && { ...run, done: true, stopped: cancelBulk.current });
    setShowBatch(true);
    clearSuggestions();
    // what was written is unmarked and everything else stays marked, so the set
    // left behind is exactly the Locations still wanting a person — including
    // the ones a stopped run never reached
    setMarked((current) => {
      const next = new Set(current);
      done.forEach((id) => next.delete(id));
      return next;
    });
    refresh();
    // no toast: the window says all of this, per Location, and a line saying it
    // again over the top of it is the same news twice
  };

  /**
   * The run over the marked set, and whether its window is open.
   *
   * Two states because they are two facts. The run outlives the window — closing
   * it must not stop the work — and the window outlives the run, because the
   * verdict is what the whole thing was for.
   */
  const [batch, setBatch] = useState<BatchRun | null>(null);
  const [showBatch, setShowBatch] = useState(false);

  return {
    bulk,
    batch,
    setBatch,
    showBatch,
    setShowBatch,
    quickBusy,
    stopBulk,
    retypeMarked,
    quickGeocode,
    geocodeMarked,
    assignFromBatch,
  };
};
