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
  StyledGazetteerCell,
  StyledGazetteerFigure,
  StyledGazetteerFootnote,
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

/**
 * A further column of the table, filled per source.
 *
 * Where the table is also the place a source's other properties are edited — the
 * project's resource and record URL — the switch and the figures stay as they are
 * and the extra cells sit to their right on the same row, so one source is one
 * line however many things are said about it.
 */
export interface GazetteerColumn {
  title: string;
  /** The column's width in the grid: a length, or `1fr` for the one that takes the rest. */
  width: string;
  render: (name: string) => React.ReactNode;
}

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
  columns?: GazetteerColumn[];
}

export const GazetteerPicker: React.FC<GazetteerPicker> = ({
  disabled,
  onChange,
  lockedOff = [],
  columns = [],
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
    <StyledGazetteerTable $extra={columns.map((column) => column.width)}>
      <StyledGazetteerHead>
        <span>gazetteer</span>
        <span>what the engine measured of it</span>
        {columns.map((column) => (
          <span key={column.title}>{column.title}</span>
        ))}
      </StyledGazetteerHead>
      {rows.map(({ name, suggester }) => {
        const lockedHere = locked.has(name);
        const isOff = lockedHere || off.has(name);
        return (
          <StyledGazetteerRow key={name}>
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
            <StyledGazetteerFigure $off={isOff} title={footprintNote(suggester)}>
              {footprintFigure(suggester)}
            </StyledGazetteerFigure>
            {columns.map((column) => (
              <StyledGazetteerCell key={column.title}>{column.render(name)}</StyledGazetteerCell>
            ))}
          </StyledGazetteerRow>
        );
      })}
      {suggesters ? null : (
        <StyledGazetteerFootnote>
          The engine is unreachable, so what it measures of each source cannot be listed. The
          switches still work and are still sent.
        </StyledGazetteerFootnote>
      )}
    </StyledGazetteerTable>
  );
};
