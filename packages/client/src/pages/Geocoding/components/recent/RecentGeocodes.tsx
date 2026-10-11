import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { IconWithTooltip } from "components";
import { IcoChevronDown } from "Theme/icons";
import { SuggestionCard } from "../../containers/suggestions/GeocodingSuggestions";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { agoLabel, RecentGeocode } from "../../utils/write/recentGeocodes";
import {
  StyledRecent,
  StyledRecentCaret,
  StyledRecentCount,
  StyledRecentExpand,
  StyledRecentLine,
  StyledRecentHead,
  StyledRecentItem,
  StyledRecentList,
  StyledRecentMeta,
  StyledRecentName,
  StyledRecentRow,
} from "./RecentGeocodesStyles";

/**
 * The places just given a coordinate, over the map's left edge.
 *
 * A researcher working down a list moves on from each place as it is written,
 * and the question that follows a few minutes later — where did that one end
 * up? — is answered here without searching the list for it. Choosing an entry
 * takes the map to it.
 *
 * An entry that arrives while the strip is on screen grows into the head of the
 * list rather than appearing, so a write made from the other side of the page is
 * noticed. Entries already there when the strip mounts do not animate: opening
 * the page is not forty arrivals.
 */

const OPEN_KEY = "geocoding:recentOpen";
const CLOCK_MS = 30_000;
const ARRIVE_MS = 1000;

const NOOP = () => undefined;
const NO_ROLES = {} as IGeocodingRoles;

const keyOf = (entry: RecentGeocode) => `${entry.id}:${entry.at}`;

const readOpen = (): boolean => {
  try {
    return window.localStorage.getItem(OPEN_KEY) !== "no";
  } catch {
    return true;
  }
};

interface RecentGeocodes {
  recent: RecentGeocode[];
  onShow: (entry: RecentGeocode) => void;
}

export const RecentGeocodes: React.FC<RecentGeocodes> = ({ recent, onShow }) => {
  const [open, setOpen] = useState(readOpen);
  const [now, setNow] = useState(() => Date.now());
  // one entry's card is open at a time: the strip is a glance, and two cards
  // would push the rest of the list off the map
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState(false);
  const seen = useRef(new Set(recent.map(keyOf)));

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => window.clearInterval(clock);
  }, []);

  // marked before the browser paints, so an arriving entry is never seen once at
  // full height before it starts to grow; cleared after the animation has run, so
  // a re-render partway through it does not cut it short
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  useLayoutEffect(() => {
    const added = recent.map(keyOf).filter((key) => !seen.current.has(key));
    if (!added.length) {
      return;
    }
    added.forEach((key) => seen.current.add(key));
    setFresh(new Set(added));
    const done = window.setTimeout(() => setFresh(new Set()), ARRIVE_MS);
    return () => window.clearTimeout(done);
  }, [recent]);

  if (!recent.length) {
    return null;
  }

  return (
    <StyledRecent $wide={open && expanded !== null}>
      <StyledRecentHead
        type="button"
        aria-expanded={open}
        onClick={() =>
          setOpen((current) => {
            try {
              window.localStorage.setItem(OPEN_KEY, current ? "no" : "yes");
            } catch {
              // the strip still opens and closes; only remembering is lost
            }
            return !current;
          })
        }
      >
        <StyledRecentCaret $open={open}>
          <IcoChevronDown />
        </StyledRecentCaret>
        recently geocoded
        <StyledRecentCount>{recent.length}</StyledRecentCount>
      </StyledRecentHead>
      {open ? (
        <StyledRecentList aria-label="Recently geocoded">
          {recent.map((entry) => {
            const key = keyOf(entry);
            const isOpen = expanded === key && !!entry.suggestion;
            return (
              <StyledRecentItem key={key} $fresh={fresh.has(key)}>
                <StyledRecentLine>
                  <StyledRecentRow type="button" onClick={() => onShow(entry)}>
                    <StyledRecentName>{entry.label}</StyledRecentName>
                    <StyledRecentMeta>
                      {agoLabel(entry.at, now)} · {entry.accuracy}
                    </StyledRecentMeta>
                  </StyledRecentRow>
                  {entry.suggestion ? (
                    <IconWithTooltip
                      icon={
                        <StyledRecentExpand
                          type="button"
                          $open={isOpen}
                          aria-expanded={isOpen}
                          aria-label={isOpen ? "hide the suggestion" : "show the suggestion"}
                          onClick={() => {
                            setAllMatches(false);
                            setExpanded(isOpen ? null : key);
                          }}
                        >
                          <IcoChevronDown />
                        </StyledRecentExpand>
                      }
                      tooltipLabel="The suggestion taken"
                      tooltipText="The card this coordinate was taken from, as it was when it was chosen."
                      tooltipPosition="bottom-end"
                    />
                  ) : null}
                </StyledRecentLine>
                {isOpen && entry.suggestion ? (
                  <SuggestionCard
                    suggestion={entry.suggestion}
                    index={0}
                    total={1}
                    topScore={entry.suggestion.score}
                    mergeRadiusKm={undefined}
                    band={null}
                    roles={NO_ROLES}
                    pendingHere={null}
                    accuracyMenuOpen={false}
                    menuAnchor={null}
                    allMatches={allMatches}
                    onToggleMatches={() => setAllMatches((current) => !current)}
                    onShowOnMap={() => onShow(entry)}
                    onUseAs={NOOP}
                    onOpenAccuracyMenu={NOOP}
                    onCloseAccuracyMenu={NOOP}
                    onPickTypeStepAccuracy={NOOP}
                    onCancelPending={NOOP}
                    onChooseKind={NOOP}
                    preview
                  />
                ) : null}
              </StyledRecentItem>
            );
          })}
        </StyledRecentList>
      ) : null}
    </StyledRecent>
  );
};
