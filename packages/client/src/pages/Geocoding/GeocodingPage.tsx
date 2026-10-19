import {
  GeocodingAccuracy,
  GeocodingBbox,
  IGeocodingContext,
  IGeocodingContextWeights,
} from "@inkvisitor/shared/types/geocoding";
import { IUserOptions } from "@inkvisitor/shared/types";
import { pointGeometry } from "@inkvisitor/shared/types/geometry";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Box, Button, Panel } from "components";
import { LayoutSeparatorVertical } from "components/advanced";
import { useUserQuery } from "hooks/react-query/useUserQuery";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useAppSelector } from "redux/hooks";
import { IcoMenuFold, IcoMenuUnfold } from "Theme/icons";
import { ButtonSize } from "types";
import { ENGINE_URL, engineHealth } from "./utils/engine/engine";
import { fixtureModeAvailable, isFixtureMode, setFixtureMode } from "./utils/engine/fixtureMode";
import {
  QUERY_FIELDS,
  CUSTOM_REGION,
  QueryField,
  contextValues,
  valuesPatch,
} from "./utils/context/geocodingContextFields";
import { GeocodingList } from "./containers/list/GeocodingList";
import { MapFocus, nextFocus } from "./utils/map/mapFocus";
import { bandOf } from "./utils/suggestions/suggestionRank";
import { GeocodingBatchModal } from "./containers/modals/GeocodingBatchModal";
import { GeocodingActivityModal } from "./containers/modals/GeocodingActivityModal";
import { GeocodingContextModal } from "./containers/modals/GeocodingContextModal";
import { GeocodingOverwriteModal } from "./containers/modals/GeocodingOverwriteModal";
import { GeocodingMap } from "./containers/map/GeocodingMap";
import { HintLayer } from "./components/shared/HintLayer";
import { GeocodingSuggestions, VISIBLE_SUGGESTIONS } from "./containers/suggestions/GeocodingSuggestions";
import { StyledEngineDot, StyledEngineLabel, StyledEngineStatus } from "./GeocodingPageStyles";
import { EngineState } from "./types/page";
import { useGeocodingBrowse } from "./hooks/useGeocodingBrowse";
import { useGeocodingBulk } from "./hooks/useGeocodingBulk";
import { useGeocodingConfig } from "./hooks/useGeocodingConfig";
import { useGeocodingPanels } from "./hooks/useGeocodingPanels";
import { GeocodingLocation } from "./hooks/useGeocodingLocations";
import { PlaceTypesProvider } from "./hooks/placeTypesContext";
import { PLACE_TYPE_ASSIGNMENTS_KEY } from "./hooks/usePlaceTypeAssignments";
import { useGeocodingSuggest } from "./hooks/useGeocodingSuggest";
import { useGeocodingWriter } from "./hooks/useGeocodingWriter";
import { useRecentGeocodes } from "./hooks/useRecentGeocodes";

/**
 * How long after the last movement of a weight slider it is written.
 *
 * Long enough that one drag is one write, short enough that letting go and
 * pressing regeocode saves what is being asked about.
 */
const WEIGHT_SAVE_DELAY_MS = 400;

/**
 * How long the hovered card survives the pointer leaving its mark.
 *
 * Long enough to reach it. The card sits beside the mark rather than on it, so
 * the pointer crosses bare map on the way — and the map reports that as
 * hovering nothing, which would close the card being reached for.
 */
const HOVER_GRACE_MS = 260;

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
  /**
   * How many saves are waiting to land, so the local copy is not re-seeded under
   * them.
   *
   * Each save's success refetches the user, and a refetch after the first of two
   * quick edits arrives before the second has been saved: re-seeding then would
   * put the stored state over the second edit until its own refetch.
   */
  const unsaved = useRef(0);
  const [isSaving, setIsSaving] = useState(false);
  const holdSave = () => {
    unsaved.current += 1;
    setIsSaving(true);
  };
  const releaseSave = () => {
    unsaved.current -= 1;
    if (unsaved.current === 0) {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    if (!isSaving) {
      setContext(JSON.parse(storedKey) as IGeocodingContext);
    }
  }, [storedKey, isSaving]);

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

  const save = (patch: IGeocodingContext) => {
    holdSave();
    saveContext
      .mutateAsync(patch)
      .catch(() => undefined)
      .finally(releaseSave);
  };

  /**
   * One dimension of the question, as the list of values it holds.
   *
   * An empty list is stored rather than removed, because that is what the
   * layering reads as "nothing said here", and it lets the project's own answer
   * through. The single-value field an older save carries is blanked beside it,
   * or a cleared list would bring that value back.
   */
  const setContextValues = (field: QueryField, chosen: string[]) => {
    // the drawn region sits among the named ones as a value of its own, so what
    // is chosen has to be read for what happened to it
    const values = field === "region" ? chosen.filter((value) => value !== CUSTOM_REGION) : chosen;
    if (field === "region" && context.regionBbox && !values.length) {
      // the drawn entry left alone changes nothing; taking it away drops the
      // box and gives back whatever names were stored beneath it
      if (!chosen.includes(CUSTOM_REGION)) {
        setRegionBox(null);
      }
      return;
    }
    // a named region and a hand-drawn box are two answers to the same question,
    // and the engine refuses a request carrying both — so naming a region drops
    // whatever was drawn rather than leaving an area nothing will send
    const patch: IGeocodingContext =
      field === "region" && values.length
        ? { ...valuesPatch(field, values), regionBbox: null }
        : valuesPatch(field, values);
    setContext((current) => ({
      ...current,
      // empty falls back to the project's answer, as the layering will on reload
      ...valuesPatch(field, values.length ? values : contextValues(projectContext, field)),
      ...(field === "region" && values.length ? { regionBbox: null } : {}),
    }));
    save(patch);
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
  useEffect(
    () => () => {
      if (weightSave.current) {
        clearTimeout(weightSave.current);
      }
    },
    [],
  );
  const setContextWeight = (field: QueryField, weight: number) => {
    setContext((current) => ({
      ...current,
      contextWeights: { ...current.contextWeights, [field]: weight },
    }));
    pendingWeights.current = { ...pendingWeights.current, [field]: weight };
    if (weightSave.current) {
      clearTimeout(weightSave.current);
    } else {
      // held from the first move, since the edit is already local and the save
      // is still a pause away
      holdSave();
    }
    weightSave.current = setTimeout(() => {
      const contextWeights = pendingWeights.current;
      pendingWeights.current = {};
      weightSave.current = null;
      saveContext
        .mutateAsync({ contextWeights })
        .catch(() => undefined)
        .finally(releaseSave);
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
    save({ regionBbox: box });
  };

  /** Drops every personal query value, so all four fall back to the project's. */
  const resetContext = () => {
    setContext((current) => ({
      ...current,
      ...Object.assign(
        {},
        ...QUERY_FIELDS.map((field) => valuesPatch(field, contextValues(projectContext, field))),
      ),
      regionBbox: projectContext.regionBbox ?? null,
      contextWeights: projectContext.contextWeights,
    }));
    save({
      ...Object.assign({}, ...QUERY_FIELDS.map((field) => valuesPatch(field, []))),
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

  /** What one write does for itself, done once for a run of them. */
  const refreshLocations = () => {
    queryClient.invalidateQueries({ queryKey: ["geocoding-locations"] });
    queryClient.invalidateQueries({ queryKey: ["geocoding-values"] });
    queryClient.invalidateQueries({ queryKey: [PLACE_TYPE_ASSIGNMENTS_KEY] });
  };

  /**
   * The next Location still wanting a coordinate, skipping the one being written.
   *
   * Chosen before the write rather than after: the row moves to the end of the
   * geocoded group as soon as its coordinate lands, so an index taken afterwards
   * points at a different place in the list.
   */
  const nextToDo = (writingId: string) =>
    browse.visible.find((location) => !location.isGeocoded && location.entity.id !== writingId);

  /**
   * Runs a write and moves on.
   *
   * Moving on means the next Location with no coordinate, which is the row that
   * has just risen to the top of that group — the researcher works down from
   * there while what they finished sits directly above the boundary.
   */
  const writeAndAdvance = async (
    input: Parameters<typeof write>[0],
    options?: Parameters<typeof write>[1],
  ) => {
    const next = nextToDo(input.location.id);
    if (await write(input, options)) {
      browse.markWritten(input.location.id);
      setSelected(next);
      return;
    }
    // a write held for confirmation advances when it is confirmed, and the
    // successor has to be the one chosen before the list moved
    advanceTo.current = next;
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
    placeType?: string | null;
    at: number;
  } | null>(null);
  const mapChoices = useRef(0);

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

  const closeHover = useRef<number | null>(null);

  const hoverOnMap = useCallback(
    (index: number | null, at: { left: number; top: number } | null) => {
      if (closeHover.current !== null) {
        window.clearTimeout(closeHover.current);
        closeHover.current = null;
      }
      if (index === null || !at) {
        closeHover.current = window.setTimeout(() => setHoveredSuggestion(null), HOVER_GRACE_MS);
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

  /**
   * Selecting one of the other Locations drawn on the map.
   *
   * Held stable across renders: the map registers its click handler once per
   * change of this function, and a fresh one on every render of this page would
   * tear that listener down and rebuild it on every keystroke elsewhere.
   */
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
    placeType?: string | null,
  ) => {
    mapChoices.current += 1;
    setChosenOnMap({ index, accuracy, placeType, at: mapChoices.current });
  };
  useEffect(() => setChosenOnMap(null), [selected?.entity.id]);

  /** Where to go once a held write is confirmed, chosen before the list changed. */
  const advanceTo = useRef<GeocodingLocation | undefined>(undefined);

  /**
   * Records what kind of place a Location is, leaving its geometry alone.
   *
   * The geometry and accuracy are written back unchanged because the write
   * replaces every role it owns, and a partial one would leave a Location with a
   * kind and no geometry. A Location with no geometry has nothing to write
   * against, so the mark on its row is a label rather than a control.
   */
  const retype = async (
    location: GeocodingLocation,
    placeType: string | null,
    options?: { quiet?: boolean },
  ): Promise<boolean> => {
    if (!user?.options || !location.geometry) {
      return false;
    }
    return write(
      {
        location: location.entity,
        roles,
        geometry: location.geometry,
        accuracy: location.accuracy || GeocodingAccuracy.Unknown,
        placeType,
        current: location.geometry,
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
  const { recent, record: recordRecent } = useRecentGeocodes();
  const { write, blocked, clearBlocked, pendingOverwrite, confirmOverwrite, cancelOverwrite } =
    useGeocodingWriter(roles, recordRecent);

  // a refused write says why. Without this the researcher cannot tell an accept
  // that worked from one the project's configuration silently rejected.
  useEffect(() => {
    if (blocked) {
      toast.error(blocked);
      clearBlocked();
    }
  }, [blocked, clearBlocked]);
  const suggest = useGeocodingSuggest();
  const {
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
  } = useGeocodingBulk({
    user,
    roles,
    context,
    locations: browse.all,
    markWritten: browse.markWritten,
    marked,
    setMarked,
    write,
    retype,
    refresh: refreshLocations,
    clearSuggestions: suggest.clear,
    onSelect: setSelected,
    onShowOnMap: (lat, lon) => setFocus((current) => nextFocus(current, lat, lon)),
  });

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
   * page that works, and green would say it was — the dot has to carry the
   * unconfigured state itself.
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
    <PlaceTypesProvider placeTypes={roles.placeTypes}>
      <HintLayer />
      {/* Three panels rather than one holding a grid, the way MainPage composes
          its four. Box owns its own borders through the theme, which is also
          what stops the hairlines between panels reading as heavy ruled lines
          in dark mode. */}
      <Panel width={panels.listWidth} widthVarIndex={0}>
        <Box
          label="Locations"
          height={contentHeight}
          isExpanded={panels.listExpanded}
          onHeaderClick={panels.toggleList}
          disableHeaderClick
          buttons={[
            <Button
              key="fold"
              onClick={panels.toggleList}
              inverted
              shape="square"
              size={ButtonSize.Small}
              icon={panels.listExpanded ? <IcoMenuFold /> : <IcoMenuUnfold />}
            />,
          ]}
        >
          <GeocodingList
            browse={browse}
            selectedId={selected?.entity.id}
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
            onCancelMarkedRetype={stopBulk}
            engineReady={engineReady}
            onShowOnMap={(location) =>
              location.lat != null && location.lon != null
                ? setFocus((current) =>
                    nextFocus(current, location.lat as number, location.lon as number),
                  )
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

      {panels.listExpanded ? (
        <LayoutSeparatorVertical
          separatorXPosition={panels.separators.list}
          resolveDrag={panels.resolveListDrag}
          setSeparatorXPosition={panels.setListSeparator}
        />
      ) : null}

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
            <StyledEngineStatus data-hint={engineLabel[engineState]}>
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
            canvasWidth={panels.mapCanvasWidth}
            covered={panels.mapCovered}
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
            focus={focus}
            recent={recent}
            onShowRecent={(lat, lon) => setFocus((current) => nextFocus(current, lat, lon))}
            onRegionBox={setRegionBox}
            onChooseSuggestion={chooseOnMap}
            onSelectLocation={selectOnMap}
            onHoverSuggestion={hoverOnMap}
            highlighted={highlighted}
            leader={leader}
            onAssign={(geometry, accuracy, placeType) => {
              if (!selected || !user?.options) {
                return;
              }
              writeAndAdvance({
                location: selected.entity,
                roles,
                geometry,
                accuracy,
                // an undecided kind of place keeps whatever the Location carries,
                // which is what a coordinate correction means
                placeType: placeType === undefined ? selected.placeType : placeType,
                current: selected.geometry,
                userOptions: user.options,
              });
            }}
          />
        </Box>
      </Panel>

      {panels.suggestionsExpanded ? (
        <LayoutSeparatorVertical
          separatorXPosition={panels.separators.suggestions}
          resolveDrag={panels.resolveSuggestionsDrag}
          setSeparatorXPosition={panels.setSuggestionsSeparator}
        />
      ) : null}

      <Panel width={panels.suggestionsWidth} widthVarIndex={2}>
        <Box
          label="Suggestions"
          height={contentHeight}
          isExpanded={panels.suggestionsExpanded}
          onHeaderClick={panels.toggleSuggestions}
          disableHeaderClick
          buttons={[
            <Button
              key="fold"
              onClick={panels.toggleSuggestions}
              inverted
              shape="square"
              size={ButtonSize.Small}
              icon={panels.suggestionsExpanded ? <IcoMenuUnfold /> : <IcoMenuFold />}
            />,
          ]}
        >
          <GeocodingSuggestions
            selected={selected}
            hovered={hoveredSuggestion}
            onHoldHover={holdHover}
            highlighted={highlighted}
            onHoverCard={setHoveredCard}
            roles={roles}
            context={context}
            projectContext={projectContext}
            onContextChange={setContextValues}
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
            onAccept={(suggestion, accuracy, provenance, placeType, afterWrite) => {
              if (!selected || !user?.options) {
                return;
              }
              writeAndAdvance(
                {
                  location: selected.entity,
                  roles,
                  geometry: pointGeometry(suggestion.lon, suggestion.lat),
                  accuracy,
                  // the researcher's answer, not the engine's: a suggestion often
                  // carries no type, and the twelve are a judgement about the
                  // place rather than a summary of what the sources called it
                  placeType,
                  provenance,
                  current: selected.geometry,
                  userOptions: user.options,
                },
                { suggestion, afterWrite },
              );
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
          onStop={batch.done ? undefined : stopBulk}
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
    </PlaceTypesProvider>
  );
};
