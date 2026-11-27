import { Button, Checkbox, Input } from "components";
import React from "react";
import { IcoArrowDown, IcoArrowUp, IcoPlus, IcoTrash } from "Theme/icons";
import { ButtonSize } from "types";
import {
  AccuracyList,
  addAccuracy,
  markAccuracy,
  moveAccuracy,
  removeAccuracy,
  setAccuracyConcept,
} from "../../utils/write/accuracyEdits";
import {
  StyledAccuracyActions,
  StyledAccuracyCell,
  StyledAccuracyHeader,
  StyledAccuracyMark,
  StyledAccuracyRow,
  StyledAccuracyScroll,
} from "./AccuracyTableStyles";

/**
 * The accuracies a researcher chooses between when a coordinate is accepted.
 *
 * The owner lists the Concepts, in the order they are offered. One of them is
 * marked as what is taken without asking when a suggestion's sources agree on the
 * spot, and one as what is taken when they are scattered: a suggestion card's
 * main button and quick geocoding take those. The description is the Concept's
 * own detail, written to the Concept when the window is saved.
 */

interface AccuracyTable {
  value: AccuracyList;
  onChange: (next: AccuracyList) => void;
  /** The assigned Concept with its unlink, or the suggester that picks one. */
  renderConcept: (conceptId: string, set: (conceptId: string | null) => void) => React.ReactNode;
  /** A Concept's detail as the table shows it: what was typed here, or what the Concept holds. */
  detailOf: (conceptId: string) => string;
  /** Whether a Concept has been read, so its detail can be edited without replacing one not yet shown. */
  detailReady: (conceptId: string) => boolean;
  onDetailChange: (conceptId: string, detail: string) => void;
}

export const AccuracyTable: React.FC<AccuracyTable> = ({
  value,
  onChange,
  renderConcept,
  detailOf,
  detailReady,
  onDetailChange,
}) => {
  const mark = (
    conceptId: string,
    which: "accuracyWhenAgree" | "accuracyWhenScattered",
    tooltip: string
  ) => (
    <StyledAccuracyMark>
      <Checkbox
        value={!!conceptId && value[which] === conceptId}
        disabled={!conceptId}
        onChangeFn={(on) => onChange(markAccuracy(value, which, on ? conceptId : ""))}
        tooltipLabel={conceptId ? tooltip : "assign a Concept first"}
      />
    </StyledAccuracyMark>
  );

  return (
    <StyledAccuracyScroll>
      <StyledAccuracyHeader>
        <span>Concept a coordinate's accuracy is valued with</span>
        <span>sources agree</span>
        <span>sources scattered</span>
        <span>description</span>
        <span />
        <span />
        <span />
      </StyledAccuracyHeader>
      {value.accuracies.map((conceptId, index) => (
        // a row is its Concept; one without a Concept, or the second row of a
        // Concept listed twice (which Save refuses), is its place in the list
        <StyledAccuracyRow
          key={
            conceptId && value.accuracies.indexOf(conceptId) === index
              ? `c-${conceptId}`
              : `row-${index}`
          }
        >
          <StyledAccuracyCell>
            {renderConcept(conceptId, (next) => onChange(setAccuracyConcept(value, index, next)))}
          </StyledAccuracyCell>
          {mark(
            conceptId,
            "accuracyWhenAgree",
            "taken without asking when a suggestion's sources agree on the spot"
          )}
          {mark(
            conceptId,
            "accuracyWhenScattered",
            "taken without asking when a suggestion's sources are scattered"
          )}
          <Input
            type="textarea"
            rows={1}
            value={conceptId ? detailOf(conceptId) : ""}
            onChangeFn={(detail) => onDetailChange(conceptId, detail)}
            placeholder={
              !conceptId
                ? "assign a Concept first"
                : detailReady(conceptId)
                  ? "the Concept's detail"
                  : "reading the Concept"
            }
            disabled={!conceptId || !detailReady(conceptId)}
            changeOnType
            width="full"
          />
          <Button
            icon={<IcoArrowUp />}
            inverted
            tooltipLabel="offer this one earlier"
            disabled={index === 0}
            onClick={() => onChange(moveAccuracy(value, index, -1))}
            shape="square"
          />
          <Button
            icon={<IcoArrowDown />}
            inverted
            tooltipLabel="offer this one later"
            disabled={index === value.accuracies.length - 1}
            onClick={() => onChange(moveAccuracy(value, index, 1))}
            shape="square"
          />
          <Button
            icon={<IcoTrash />}
            color="danger"
            inverted
            tooltipLabel="remove this accuracy from the list — Locations already valued with it keep it"
            onClick={() => onChange(removeAccuracy(value, index))}
            shape="square"
          />
        </StyledAccuracyRow>
      ))}
      <StyledAccuracyActions>
        <Button
          icon={<IcoPlus />}
          label="add an accuracy"
          color="primary"
          inverted
          onClick={() => onChange(addAccuracy(value))}
          size={ButtonSize.Medium}
        />
      </StyledAccuracyActions>
    </StyledAccuracyScroll>
  );
};
