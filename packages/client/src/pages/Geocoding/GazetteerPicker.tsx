import { useQuery } from "@tanstack/react-query";
import React from "react";
import { engineSuggesters } from "./engine";
import {
  LLM_SOURCE,
  footprintFigure,
  footprintNote,
  gazetteerRows,
  isHealthy,
  withSource,
} from "./gazetteerCatalogue";
import {
  StyledGazetteerFigure,
  StyledGazetteerHead,
  StyledGazetteerLabel,
  StyledGazetteerLocked,
  StyledGazetteerName,
  StyledGazetteerNote,
  StyledGazetteerRow,
  StyledGazetteerSwitch,
  StyledGazetteerTable,
  StyledGazetteerUnwell,
} from "./GazetteerPickerStyles";

/**
 * Which gazetteers the engine is allowed to ask.
 *
 * The same control in both places it is set — the project's own list and a
 * researcher's — because it is one question asked of two people, and two
 * screens that looked different would suggest the answers meant different
 * things. What differs is only what a row may say: a personal list cannot
 * switch back on what the project switched off, so those rows are held down and
 * say why.
 *
 * Each row carries what the engine measured of that source, which is the half
 * of the decision nobody can make from the name. `sedac-india` holds 621,528
 * records in 340 one-degree cells and `native-land` holds 2,057 in 1,292 — one
 * is about a place and the other is about everywhere and thin, and the region
 * half of every score they contribute is computed from exactly that. A source
 * with no local records is not measured but declared, and a declaration always
 * scores below a measurement.
 */

interface GazetteerPicker {
  /** The names switched off at this layer, which is what the control edits. */
  disabled: string[];
  onChange: (disabled: string[]) => void;
  /**
   * Names the project has already switched off, when this is a personal list.
   *
   * Held down rather than hidden: a row that vanished would read as a gazetteer
   * the engine does not have, and the reason it cannot be switched on is worth
   * one line.
   */
  lockedOff?: string[];
}

export const GazetteerPicker: React.FC<GazetteerPicker> = ({
  disabled,
  onChange,
  lockedOff = [],
}) => {
  // the same query key the context panel uses for `/parameters` has its own
  // entry; this one is the catalogue, and both are answered once per hour
  const { data: suggesters } = useQuery({
    queryKey: ["geocoding-suggesters"],
    queryFn: ({ signal }) => engineSuggesters(signal),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const rows = gazetteerRows(suggesters);
  const off = new Set(disabled);
  const locked = new Set(lockedOff);

  return (
    <StyledGazetteerTable>
      <StyledGazetteerHead>
        <span>gazetteer</span>
        <span>what the engine measured of it</span>
      </StyledGazetteerHead>
      {rows.map(({ name, suggester }) => {
        const lockedHere = locked.has(name);
        const isOff = lockedHere || off.has(name);
        return (
          <StyledGazetteerRow key={name} $off={isOff}>
            <StyledGazetteerSwitch>
              <input
                type="checkbox"
                checked={!isOff}
                disabled={lockedHere}
                aria-label={`ask ${name}`}
                onChange={(event) => onChange(withSource(disabled, name, !event.target.checked))}
              />
              <StyledGazetteerName>
                <StyledGazetteerLabel $off={isOff}>{name}</StyledGazetteerLabel>
                {name === LLM_SOURCE ? (
                  <StyledGazetteerNote>
                    the model&apos;s own guess, not a gazetteer
                  </StyledGazetteerNote>
                ) : null}
                {suggester && !isHealthy(suggester) ? (
                  <StyledGazetteerUnwell>
                    {suggester.health.reason || suggester.health.status}
                  </StyledGazetteerUnwell>
                ) : null}
                {lockedHere ? (
                  <StyledGazetteerLocked>
                    off for the whole project — an owner sets this
                  </StyledGazetteerLocked>
                ) : null}
              </StyledGazetteerName>
            </StyledGazetteerSwitch>
            <StyledGazetteerFigure title={footprintNote(suggester)}>
              {footprintFigure(suggester)}
            </StyledGazetteerFigure>
          </StyledGazetteerRow>
        );
      })}
      {suggesters ? null : (
        <StyledGazetteerNote>
          The engine is unreachable, so what it measures of each source cannot be listed. The
          switches still work and are still sent.
        </StyledGazetteerNote>
      )}
    </StyledGazetteerTable>
  );
};
