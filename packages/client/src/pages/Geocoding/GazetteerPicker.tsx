import React from "react";
import { GazetteerHover } from "./GazetteerTag";
import { LLM_SOURCE, gazetteerRows, isHealthy, withSource } from "./gazetteerCatalogue";
import {
  StyledGazetteerCell,
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
import { useGazetteerCatalogue } from "./useGazetteerCatalogue";

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
  const suggesters = useGazetteerCatalogue();

  const rows = gazetteerRows(suggesters);
  const off = new Set(disabled);
  const locked = new Set(lockedOff);

  return (
    <StyledGazetteerTable $extra={columns.map((column) => column.width)}>
      <StyledGazetteerHead>
        <span>gazetteer</span>
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
                <GazetteerHover source={name}>
                  <StyledGazetteerLabel $off={isOff}>{name}</StyledGazetteerLabel>
                </GazetteerHover>
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
            {columns.map((column) => (
              <StyledGazetteerCell key={column.title}>{column.render(name)}</StyledGazetteerCell>
            ))}
          </StyledGazetteerRow>
        );
      })}
    </StyledGazetteerTable>
  );
};
