import { EntityTag } from "components/advanced";
import { IconWithTooltip } from "components";
import {
  IcoBolt,
  IcoCheckboxChecked,
  IcoCheckboxUnchecked,
  IcoChevronDown,
  IcoFlyTo,
  IcoGeocode,
} from "Theme/icons";
import React from "react";
import { ClipLoader } from "react-spinners";
import { RowComponentProps } from "react-window";
import { useTheme } from "hooks";
import {
  StyledGroupCaret,
  StyledGroupCount,
  StyledGroupHead,
  StyledGroupLabel,
  StyledRow,
  StyledRowAction,
  StyledRowActions,
  StyledRowMain,
  StyledRowMark,
  StyledRowMarkBox,
  StyledRowMeta,
  StyledRowProblem,
  StyledRowTag,
  StyledRowType,
  StyledRowTypeStatic,
} from "./GeocodingListStyles";
import { ListItem, LocationGroup } from "./geocodingGroups";
import { PlaceTypeIcon, placeTypeInfo } from "./placeTypeIcons";
import { QUICK_STRATEGY_MEANING, QuickStrategy } from "./quickGeocode";
import { GeocodingLocation } from "./useGeocodingLocations";

/**
 * A group's heading.
 *
 * The same element whether it is in the list or parked against an edge of it,
 * because it is the same heading — a parked one is only a heading that has
 * scrolled out of reach. `onGoTo` is what a parked one adds: in flow the rows it
 * names are directly beneath it, and there is nowhere to go.
 */
export const GroupHeading: React.FC<{
  group: LocationGroup;
  onToggle: (key: string) => void;
  onGoTo?: (key: string) => void;
}> = ({ group, onToggle, onGoTo }) => (
  <StyledGroupHead
    type="button"
    aria-expanded={!group.collapsed}
    title={onGoTo ? `go to ${group.label}` : undefined}
    onClick={() => (onGoTo ? onGoTo(group.key) : onToggle(group.key))}
  >
    <StyledGroupLabel>
      {/* the caret opens and closes the group wherever the heading is; parked,
          the rest of the heading goes to it instead, which is the one thing a
          heading in flow has no need of */}
      <StyledGroupCaret
        as="span"
        role="button"
        tabIndex={0}
        $open={!group.collapsed}
        aria-label={`${group.collapsed ? "open" : "close"} ${group.label}`}
        onClick={(event: React.MouseEvent) => {
          event.stopPropagation();
          onToggle(group.key);
        }}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onToggle(group.key);
          }
        }}
      >
        <IcoChevronDown />
      </StyledGroupCaret>
      {group.label}
    </StyledGroupLabel>
    <StyledGroupCount>
      {group.collapsed && group.rows.length
        ? `${group.rows.length} of ${group.total}`
        : group.total}
    </StyledGroupCount>
  </StyledGroupHead>
);

export interface GeocodingListRowProps {
  items: ListItem[];
  selectedId: string | undefined;
  engineReady: boolean;
  marked: Set<string>;
  /** Marks a row, or the run between the last one marked and this one. */
  onMarkRow: (index: number, on: boolean, range: boolean) => void;
  onSelect: (location: GeocodingLocation) => void;
  onShowOnMap: (location: GeocodingLocation) => void;
  onGeocode: (location: GeocodingLocation) => void;
  /**
   * Asks the engine and writes the answer without opening the run.
   *
   * Beside the geocode action rather than instead of it: the two are the same
   * request read two ways, and which one a row deserves is a judgement about
   * that row — an unambiguous parish against a name shared by four villages.
   */
  onQuickGeocode: (location: GeocodingLocation) => void;
  /** What the quick action will accept, said in the control that does it. */
  quickStrategy: QuickStrategy;
  /** The Location a quick geocode is running on, if it is this one. */
  quickBusyId: string | null;
  onToggleGroup: (key: string) => void;
  /** Opens the kind-of-place picker over the row's own mark. */
  onPick: (picking: {
    location: GeocodingLocation;
    anchor: { left: number; top: number; bottom: number };
  }) => void;
}

/**
 * Moves one row up or down, selecting as it goes.
 *
 * Selecting, not merely focusing: the arrow key is how the corpus is worked
 * through, and the map and the suggestions panel are the answer being walked
 * towards. Under auto-search this asks the engine for each row in turn, which is
 * what the researcher is arrowing to see; one request is in flight at a time, so
 * holding the key replaces rather than queues.
 *
 * Rows outside the rendered window have no element to move to; the overscan is
 * deep enough that the neighbour of a visible row always has one, and the
 * browser scrolls it into view when it takes focus.
 */
const stepRow = (from: HTMLElement, delta: number, props: GeocodingListRowProps) => {
  const scroller = from.closest("[role='listbox']");
  if (!scroller) {
    return;
  }
  const rows = Array.from(scroller.querySelectorAll<HTMLElement>("[data-location-row]"));
  const next = rows[rows.indexOf(from) + delta];
  if (!next) {
    return;
  }
  next.focus();
  const item = props.items[Number(next.dataset.itemIndex)];
  if (item?.kind === "row") {
    props.onSelect(item.location);
  }
};

/**
 * One row of the virtualised list: a group's heading, or a Location.
 *
 * A module-level component so its identity never changes — see `rowProps` in
 * `GeocodingList`.
 */
export const GeocodingListRow = (props: RowComponentProps<GeocodingListRowProps>) => {
  const { index, style, items, selectedId, engineReady, marked } = props;
  const theme = useTheme();
  const item = items[index];
  if (!item) {
    return <div style={style} />;
  }
  if (item.kind === "header") {
    return (
      <div style={style}>
        <GroupHeading group={item.group} onToggle={props.onToggleGroup} />
      </div>
    );
  }
  const location = item.location;
  const busy = props.quickBusyId === location.entity.id;
  return (
    <div style={style}>
      <StyledRow
        $selected={location.entity.id === selectedId}
        // the mark box is small and a shift-click that misses it lands here,
        // where the browser reads the gesture as extending a text selection and
        // highlights every row it crossed. Nothing on a row answers to shift, so
        // refusing it costs no gesture — dragging still selects text to copy
        onMouseDown={(event) => {
          if (event.shiftKey) {
            event.preventDefault();
          }
        }}
        onClick={() => props.onSelect(location)}
        role="option"
        aria-selected={location.entity.id === selectedId}
        tabIndex={0}
        data-location-row
        data-item-index={index}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            props.onSelect(location);
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            stepRow(event.currentTarget, event.key === "ArrowDown" ? 1 : -1, props);
          }
        }}
      >
        {/* one row of a set an action will apply to. Its own control, because
            the row's click is a selection and the two are different questions:
            what the map is answering about, and what a write would reach */}
        <StyledRowMarkBox
          role="checkbox"
          aria-checked={marked.has(location.entity.id)}
          aria-label={`mark ${location.entity.labels[0] || location.entity.id}`}
          tabIndex={-1}
          $marked={marked.has(location.entity.id)}
          $any={marked.size > 0}
          title={
            marked.has(location.entity.id)
              ? "drop this from the marked set"
              : "mark this — shift-click to mark a run"
          }
          // shift-click marks a run, and the browser reads the same gesture as
          // extending a text selection from wherever the last click landed —
          // which highlights every row in between, over the run being marked.
          // Refused on the press, because by the click the selection exists
          onMouseDown={(event) => {
            if (event.shiftKey) {
              event.preventDefault();
            }
          }}
          onClick={(event) => {
            event.stopPropagation();
            props.onMarkRow(index, !marked.has(location.entity.id), event.shiftKey);
          }}
        >
          {marked.has(location.entity.id) ? <IcoCheckboxChecked /> : <IcoCheckboxUnchecked />}
        </StyledRowMarkBox>
        {/* the row says whether it has a coordinate whatever the list is grouped
            by, so it still reads under "kind of place" or under one flat list,
            where no heading says it */}
        <StyledRowMark
          $state={location.isGeocoded ? "geocoded" : location.problem ? "problem" : "none"}
          title={
            location.isGeocoded ? "has a coordinate" : location.problem || "no coordinate recorded"
          }
        />
        {/* the mark is the control: a kind of place is corrected far more often
            than it is first set, and reaching it should not mean selecting the
            row and losing whatever is being judged beside it */}
        {location.isGeocoded ? (
          <StyledRowType
            type="button"
            data-row-type
            title={`${placeTypeInfo(location.placeType).label} — click to change`}
            aria-label={`kind of place: ${placeTypeInfo(location.placeType).label}`}
            $unset={!location.placeType}
            onClick={(event) => {
              event.stopPropagation();
              const box = event.currentTarget.getBoundingClientRect();
              props.onPick({
                location,
                anchor: { left: box.left, top: box.top, bottom: box.bottom },
              });
            }}
          >
            <PlaceTypeIcon placeType={location.placeType} />
          </StyledRowType>
        ) : (
          <StyledRowTypeStatic
            title={`${placeTypeInfo(location.placeType).label} — recorded with a coordinate, and this Location has none`}
            aria-label={`kind of place: ${placeTypeInfo(location.placeType).label}`}
            $unset={!location.placeType}
          >
            <PlaceTypeIcon placeType={location.placeType} />
          </StyledRowTypeStatic>
        )}
        <StyledRowMain>
          {/* the shared tag rather than a plain label: it carries the status
              border, the italic for an unlabelled entity and the hover card,
              all of which a Location in this list is read for as much as its
              name. The class glyph is dropped — every row here is a Location,
              so a letter saying so on all of them separates none of them */}
          <StyledRowTag>
            <EntityTag
              entity={location.entity}
              showOnly="label"
              fullWidth
              disableDrag
              // the row's click is a selection, and the tag's own click copies
              // the label to the clipboard half a second later — selecting a
              // Location must not put it on the clipboard
              disableCopyToClipboard
              tooltipPosition="right"
            />
          </StyledRowTag>
          {/* nothing at all for a Location that simply has none: the mark at
              the head of the row already says so, on every row, and a line of
              text repeating it on the thousand rows that are the reason this
              page exists is a column of noise. A problem is different — it is
              the one thing here that varies and cannot be guessed */}
          {location.isGeocoded ? (
            <StyledRowMeta>
              {location.lat?.toFixed(4)}, {location.lon?.toFixed(4)} · {location.accuracy}
            </StyledRowMeta>
          ) : location.problem ? (
            <StyledRowProblem>{location.problem}</StyledRowProblem>
          ) : null}
        </StyledRowMain>

        {/* the two things done to a row from the list, rather than by selecting
            it first and looking elsewhere. Shown on hover and on the selected
            row, so a list being scanned stays a list */}
        <StyledRowActions data-row-actions $busy={busy}>
          {location.isGeocoded ? (
            <StyledRowAction
              type="button"
              title="show this on the map"
              aria-label={`show ${location.entity.labels[0]} on the map`}
              onClick={(event) => {
                event.stopPropagation();
                props.onShowOnMap(location);
              }}
            >
              <IcoFlyTo />
            </StyledRowAction>
          ) : null}
          {/* only where there is work to do. A Location that already has a
              coordinate is re-checked from the panel, where the coordinate it
              would replace is on screen to be weighed against */}
          {engineReady ? (
            <>
              {/* offered on a Location that already has a coordinate too: the
                  engine's answer moves on, and re-checking one is the same act */}
              <IconWithTooltip
                tooltipLabel="quick geocode"
                tooltipText={`Asks the engine and writes the answer, without opening the run. ${
                  QUICK_STRATEGY_MEANING[props.quickStrategy]
                } Where it will not decide, it says so and leaves the Location to you.`}
                tooltipPosition="left"
                color="greyer"
                icon={
                  <StyledRowAction
                    type="button"
                    aria-label={`quick geocode ${location.entity.labels[0]}`}
                    aria-busy={busy}
                    disabled={!!props.quickBusyId}
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onQuickGeocode(location);
                    }}
                  >
                    {/* the control itself turns into the wait: a spinner beside
                        the bolt would leave the row saying both that it can be
                        asked and that it is being asked */}
                    {busy ? (
                      <ClipLoader size={13} color={theme.color["success"] as string} />
                    ) : (
                      <IcoBolt />
                    )}
                  </StyledRowAction>
                }
              />
              {!location.isGeocoded ? (
                <StyledRowAction
                  type="button"
                  title="ask the engine for this place"
                  aria-label={`geocode ${location.entity.labels[0]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    props.onGeocode(location);
                  }}
                >
                  <IcoGeocode />
                </StyledRowAction>
              ) : null}
            </>
          ) : null}
        </StyledRowActions>
      </StyledRow>
    </div>
  );
};
