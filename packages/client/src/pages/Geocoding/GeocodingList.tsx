import {
  GeocodingPlaceType,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { Button, Input, Loader } from "components";
import Dropdown from "components/advanced";
import { IcoListTree, IcoSearch } from "Theme/icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { List } from "react-window";
import {
  HEADING_HEIGHT,
  StyledArrangeIcon,
  StyledArrangeRow,
  StyledEmpty,
  StyledFilters,
  StyledListBody,
  StyledListPanel,
  StyledMarkedBar,
  StyledMarkedReach,
  StyledMarkedSpacer,
  StyledParked,
  StyledParkedHead,
} from "./GeocodingListStyles";
import { GeocodingFilterChips } from "./GeocodingFilterChips";
import { GeocodingListRow, GeocodingListRowProps, GroupHeading } from "./GeocodingListRow";
import { GeocodingTerritoryFilter, useTerritoryLabel } from "./GeocodingTerritoryFilter";
import { PlaceTypePicker } from "./PlaceTypePicker";
import { ANY, UseGeocodingBrowse, accuracyOptions } from "./useGeocodingBrowse";
import { GroupBy, ListItem, flatten, groupByOptions, idsInRange } from "./geocodingGroups";
import { GeocodingLocation } from "./useGeocodingLocations";
import { useGeocodingListScroll } from "./useGeocodingListScroll";
import { QUICK_STRATEGY_MEANING, QuickStrategy } from "./quickGeocode";
import { BatchRun, batchSummary } from "./geocodingBatch";

/**
 * The Locations list. Presentational: the collection and the filters live above
 * it, so the map beside it can never be showing a different set of places.
 */

/** One line: the entity's own tag, and what is recorded on it beside it. */
const ROW_HEIGHT = 32;
/** Shorter than a row: a heading names a group, it does not hold one. */
const HEADER_HEIGHT = HEADING_HEIGHT;

interface GeocodingList {
  browse: UseGeocodingBrowse;
  selectedId: string | undefined;
  roles: IGeocodingRoles;
  onSelect: (location: GeocodingLocation) => void;
  /** Records a kind of place on a Location without touching its coordinate. */
  onRetype: (location: GeocodingLocation, placeType: GeocodingPlaceType | null) => void;
  /** Moves the map to a Location that already has a coordinate. */
  onShowOnMap: (location: GeocodingLocation) => void;
  /** Selects a Location and runs the engine on it. */
  onGeocode: (location: GeocodingLocation) => void;
  /** Whether the engine can be asked at all. */
  engineReady: boolean;
  /** The Locations a bulk action would apply to, by entity id. */
  marked: Set<string>;
  /** Marks or unmarks a run of rows — one id, or a range from a shift-click. */
  onMark: (ids: string[], on: boolean) => void;
  onClearMarks: () => void;
  /**
   * Records one kind of place across the marked set.
   *
   * Absent while a bulk write is in flight, which is what stops a second one
   * being started over the first.
   */
  onMarkedRetype: ((placeType: GeocodingPlaceType | null) => void) | undefined;
  /** How far a bulk write has got, for the bar to say. Absent when none is running. */
  markedProgress: string | undefined;
  /** Stops a run after the write in flight. */
  onCancelMarkedRetype: () => void;
  /**
   * Geocodes the marked Locations that have none, taking the engine's answer
   * without anybody reading it.
   *
   * Absent while a bulk write is in flight, like the retype it sits beside.
   */
  onMarkedGeocode: (() => void) | undefined;
  /** Geocodes one Location the same way, from its own row. */
  onQuickGeocode: (location: GeocodingLocation) => void;
  /** The Location a quick geocode is running on, whose row draws itself busy. */
  quickBusyId: string | null;
  /** What the quick actions will accept, named for the buttons that do it. */
  quickStrategy: QuickStrategy;
  /**
   * The run over the marked set, while there is one to report on.
   *
   * It outlives the marked set it was started from — what a run wrote is
   * unmarked as it goes — so the bar stays for as long as this does, and stops
   * being about the marks at all once the run has ended.
   */
  batch: BatchRun | null;
  onShowBatch: () => void;
  onDismissBatch: () => void;
}

export const GeocodingList: React.FC<GeocodingList> = ({
  browse,
  selectedId,
  roles,
  onSelect,
  onRetype,
  onShowOnMap,
  onGeocode,
  engineReady,
  marked,
  onMark,
  onClearMarks,
  onMarkedRetype,
  markedProgress,
  onCancelMarkedRetype,
  onMarkedGeocode,
  onQuickGeocode,
  quickBusyId,
  quickStrategy,
  batch,
  onShowBatch,
  onDismissBatch,
}) => {
  const { all, visible, isLoading, error, filters, setFilter } = browse;

  // the chip states the territory by name, which needs the entity the id points
  // at; the tree the picker already reads is where that name lives
  const territoryLabel = useTerritoryLabel(
    filters.territoryId === ANY ? undefined : filters.territoryId,
  );

  /** The groups as one addressable sequence, which is what a virtualised list draws. */
  const items: ListItem[] = useMemo(() => flatten(browse.groups), [browse.groups]);

  // the range of rows the scroller has drawn. The first says which group the
  // reader is in, and both together say whether a group chosen from the index
  // is already on screen
  const { bodyRef, parked, gutter, goToGroup, goToRow } = useGeocodingListScroll(
    browse.groups,
    items,
    HEADER_HEIGHT,
    ROW_HEIGHT,
  );

  /**
   * Follows the selection when it is made somewhere else.
   *
   * A Location is chosen from this list, but also by clicking its mark on the
   * map, and a map click that leaves the list showing a different thousand rows
   * says nothing about which Location it just chose. Selecting from the list
   * itself moves nothing: the row is already in sight, and a row in sight is
   * what `goToRow` declines to scroll to.
   *
   * Keyed on the id alone. `items` changes whenever a filter, an arrangement or
   * a write rebuilds the list, and running this then would drag the reader back
   * to the selection every time they scrolled away and edited something.
   */
  useEffect(() => {
    if (selectedId) {
      goToRow(selectedId);
    }
  }, [selectedId]);

  /**
   * The last row marked by hand, which a shift-click measures its run from.
   *
   * An index into the flattened list rather than an id: a run is a stretch of
   * what is on screen, and headings sit inside it.
   */
  const lastMarked = useRef<number | null>(null);

  // the anchor is a position in the sequence, so it means nothing once the
  // sequence is rebuilt: a different arrangement, a changed filter or a
  // collapsed group reorders every index, and a run measured from the old one
  // would mark a stretch nobody pointed at
  useEffect(() => {
    lastMarked.current = null;
  }, [items]);

  const markRow = (index: number, on: boolean, range: boolean) => {
    const from = range && lastMarked.current != null ? lastMarked.current : index;
    lastMarked.current = index;
    onMark(idsInRange(items, from, index), on);
  };

  /** Where the marked set's own kind-of-place picker opens. */
  const [pickingMarked, setPickingMarked] = useState<{
    left: number;
    top: number;
    bottom: number;
  } | null>(null);

  /**
   * How many of the marked Locations a kind-of-place write can reach.
   *
   * Only those with a coordinate: the write owns the coordinate roles too, so
   * there is nothing to record a kind against without one.
   */
  /**
   * How many of the marked Locations a geocode would replace rather than fill.
   *
   * Every marked Location is geocoded, so this is not a reach but a warning: the
   * ones that already have a coordinate will be written over, and the count is
   * what says so before the button is pressed.
   */
  const toReplace = useMemo(
    () => all.filter((location) => marked.has(location.entity.id) && location.isGeocoded).length,
    [all, marked],
  );

  const reachable = useMemo(
    () => all.filter((location) => marked.has(location.entity.id) && location.isGeocoded).length,
    [all, marked],
  );

  /** The row whose kind of place is being chosen, and where its mark sits. */
  const [picking, setPicking] = useState<{
    location: GeocodingLocation;
    anchor: { left: number; top: number; bottom: number };
  } | null>(null);

  /**
   * Everything a row draws itself from.
   *
   * Handed to `react-window` as `rowProps` rather than closed over by the row
   * component. The component's identity has to hold still: it is a component
   * type, so a new function each render remounts every row on screen — which
   * throws away the focus the arrow keys are moving, and re-mounts two dozen
   * entity tags on every selection.
   */
  const rowProps: GeocodingListRowProps = useMemo(
    () => ({
      items,
      selectedId,
      engineReady,
      onQuickGeocode,
      quickBusyId,
      quickStrategy,
      onSelect,
      onShowOnMap,
      onGeocode,
      onToggleGroup: browse.toggleGroup,
      onPick: setPicking,
      marked,
      onMarkRow: markRow,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      items,
      selectedId,
      engineReady,
      onSelect,
      onShowOnMap,
      onGeocode,
      onQuickGeocode,
      quickBusyId,
      quickStrategy,
      browse.toggleGroup,
      marked,
    ],
  );

  const renderBody = () => {
    if (error) {
      return (
        <StyledEmpty>
          The locations could not be loaded.
          <br />
          This is InkVisitor&apos;s own server rather than the geocoding engine.
        </StyledEmpty>
      );
    }
    if (isLoading && !all.length) {
      return <Loader show />;
    }
    if (!visible.length) {
      return (
        <StyledEmpty>
          {all.length ? "No location matches these filters." : "No locations found."}
        </StyledEmpty>
      );
    }
    return (
      <List
        role="listbox"
        aria-label="Locations"
        rowProps={rowProps}
        rowCount={items.length}
        rowHeight={(index: number) => (items[index]?.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT)}
        style={{ height: "100%" }}
        overscanCount={8}
        rowComponent={GeocodingListRow}
      />
    );
  };

  return (
    <StyledListPanel>
      {picking ? (
        <PlaceTypePicker
          anchor={picking.anchor}
          roles={roles}
          current={picking.location.placeType}
          clearLabel="record no kind of place"
          onChoose={(placeType) => {
            onRetype(picking.location, placeType as GeocodingPlaceType | null);
            setPicking(null);
          }}
          onClose={() => setPicking(null)}
        />
      ) : null}

      <StyledFilters>
        {/* arranging the list, not narrowing it: every choice here holds the
            same Locations, so a coordinate written on one moves its row between
            groups rather than out of the view that was showing it */}
        <StyledArrangeRow>
          <Input
            value={filters.label}
            onChangeFn={(value) => setFilter("label", value)}
            placeholder="search name…"
            icon={<IcoSearch />}
            changeOnType
            width="full"
            clearable
          />
          <StyledArrangeIcon title="how the list is grouped">
            <IcoListTree />
          </StyledArrangeIcon>
          <Dropdown.Single.Basic
            width={128}
            ariaLabel="group the list by"
            tooltipLabel="group the list by"
            options={groupByOptions}
            value={browse.groupBy}
            onChange={(value) => browse.setGroupBy(value as GroupBy)}
          />
        </StyledArrangeRow>


        {/* the filters, on screen. A control reading "any" spends a field's
            width saying nothing; a chip is as wide as its content, so the bar
            grows only as the filters are actually used */}
        <GeocodingFilterChips
          chips={[
            // scope leads the row: which territory and whose Locations set up a
            // session, the rest narrow what that session already holds
            {
              key: "territoryId",
              label: "territory",
              options: [],
              valueLabel: territoryLabel,
              content: (
                <GeocodingTerritoryFilter
                  territoryId={filters.territoryId === ANY ? undefined : filters.territoryId}
                  subTerritories={filters.subTerritories === "included"}
                  onPick={(id) => setFilter("territoryId", id || ANY)}
                  onSubTerritories={(included) =>
                    setFilter("subTerritories", included ? "included" : "excluded")
                  }
                />
              ),
            },
            { key: "createdBy", label: "created by", options: browse.createdByOptions },
            { key: "accuracy", label: "accuracy", options: accuracyOptions,
              counts: browse.optionCounts.accuracy },
            { key: "placeType", label: "kind", options: browse.placeTypeOptions,
              counts: browse.optionCounts.placeType },
            { key: "language", label: "language", options: browse.languageOptions },
            { key: "status", label: "status", options: browse.statusOptions },
          ]}
          filters={filters}
          setFilter={(key, value) => setFilter(key, value)}
          onClearAll={browse.clearFilters}
        />
      </StyledFilters>

      {marked.size || batch ? (
        <StyledMarkedBar>
          {marked.size ? <span>{marked.size} marked</span> : null}
          {/* the run's own line, which replaces the marks as the thing the bar
              is about once the marks it was started from have been written */}
          {batch ? <StyledMarkedReach>{batchSummary(batch)}</StyledMarkedReach> : null}
          {/* a write owns the coordinate roles as well as the kind, so a
              Location with no coordinate is out of this action's reach and the
              count has to say so before the action is pressed */}
          {reachable < marked.size ? (
            <StyledMarkedReach>{reachable} with a coordinate</StyledMarkedReach>
          ) : null}
          {toReplace ? (
            <StyledMarkedReach>
              {toReplace} would be replaced
            </StyledMarkedReach>
          ) : null}
          {markedProgress ? (
            <StyledMarkedReach>writing {markedProgress}…</StyledMarkedReach>
          ) : null}
          <StyledMarkedSpacer />
          {batch ? (
            <Button label="progress" color="primary" onClick={onShowBatch} />
          ) : null}
          {batch?.done ? (
            <Button label="done" color="greyer" onClick={onDismissBatch} />
          ) : null}
          {markedProgress ? (
            // the run finishes the Location it is on and stops there; what is
            // already written stays written
            <Button label="stop" color="danger" onClick={onCancelMarkedRetype} />
          ) : marked.size ? (
            <>
              <Button
                label="set kind of place"
                color="primary"
                disabled={!reachable}
                tooltipLabel={
                  reachable
                    ? undefined
                    : "none of the marked Locations has a coordinate to record a kind against"
                }
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setPickingMarked({ left: box.left, top: box.top, bottom: box.bottom });
                }}
              />
              {onMarkedGeocode ? (
                <Button
                  label="geocode"
                  color="success"
                  disabled={!engineReady}
                  tooltipLabel={
                    engineReady
                      ? `${QUICK_STRATEGY_MEANING[quickStrategy]}${
                          toReplace
                            ? ` ${toReplace} already have a coordinate and it will be replaced.`
                            : ""
                        }`
                      : "the geocoding engine is not answering"
                  }
                  onClick={onMarkedGeocode}
                />
              ) : null}
              <Button label="clear" color="greyer" onClick={onClearMarks} />
            </>
          ) : null}
        </StyledMarkedBar>
      ) : null}

      {pickingMarked && onMarkedRetype ? (
        <PlaceTypePicker
          anchor={pickingMarked}
          roles={roles}
          current={undefined}
          clearLabel={`record no kind of place on ${reachable}`}
          onChoose={(placeType) => {
            onMarkedRetype(placeType as GeocodingPlaceType | null);
            setPickingMarked(null);
          }}
          onClose={() => setPickingMarked(null)}
        />
      ) : null}

      <StyledListBody ref={bodyRef}>
        {/* the headings whose groups are off screen, parked against the edge
            they left by. A heading in flow is never also here, so no group is
            named twice */}
        {parked.above.length ? (
          <StyledParked $edge="top" $gutter={gutter}>
            {parked.above.map((group) => (
              <StyledParkedHead key={group.key} $edge="top">
                <GroupHeading
                  group={group}
                  onToggle={browse.toggleGroup}
                  onGoTo={goToGroup}
                />
              </StyledParkedHead>
            ))}
          </StyledParked>
        ) : null}
        {renderBody()}
        {parked.below.length ? (
          <StyledParked $edge="bottom" $gutter={gutter}>
            {parked.below.map((group) => (
              <StyledParkedHead key={group.key} $edge="bottom">
                <GroupHeading
                  group={group}
                  onToggle={browse.toggleGroup}
                  onGoTo={goToGroup}
                />
              </StyledParkedHead>
            ))}
          </StyledParked>
        ) : null}
      </StyledListBody>
    </StyledListPanel>
  );
};
