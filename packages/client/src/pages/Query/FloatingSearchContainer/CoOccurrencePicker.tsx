import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { EntitySuggester } from "components/advanced";
import { mergeTokensIntoIds, parseEntityIdsFromText } from "pages/Query/utils";
import React, { useState } from "react";
import { IcoChevronDown, IcoCloseMd } from "Theme/icons";
import { CoOccurrenceEntityList } from "./CoOccurrenceEntityList";
import {
  StyledCoOccurrenceBox,
  StyledCoOccurrenceChevron,
  StyledCoOccurrenceClear,
  StyledCoOccurrenceSummary,
  StyledCoOccurrenceToggle,
} from "./FloatingSearchFormStyles";

interface CoOccurrencePicker {
  entityIds: string[];
  onChange: (entityIds: string[]) => void;
}

/**
 * The entities a co-occurrence filter is made of: picked one by one, or pasted
 * as complete uuids. The picked set shows as a count that expands into a list.
 */
export const CoOccurrencePicker: React.FC<CoOccurrencePicker> = ({ entityIds, onChange }) => {
  // the collapsed row shows a count only; the list below fetches the entities
  // for the rows it actually renders
  const [expanded, setExpanded] = useState(false);

  // a paste carrying complete uuids goes into the picked set instead of the
  // suggester's input, which keeps handling text pasted to search by label
  const handlePaste = (event: React.ClipboardEvent) => {
    const pasted = event.clipboardData.getData("text");
    if (parseEntityIdsFromText(pasted).length === 0) {
      return;
    }
    event.preventDefault();
    onChange(mergeTokensIntoIds(entityIds, pasted));
  };

  return (
    <StyledCoOccurrenceBox onPaste={handlePaste}>
      <EntitySuggester
        categoryTypes={classesAll}
        placeholder="pick or paste ids"
        inputWidth="full"
        disableCreate
        excludedActantIds={entityIds}
        onSelected={(entityId: string) => {
          if (!entityIds.includes(entityId)) {
            onChange([...entityIds, entityId]);
          }
        }}
      />

      {entityIds.length > 0 && (
        <StyledCoOccurrenceSummary>
          <StyledCoOccurrenceToggle type="button" onClick={() => setExpanded(!expanded)}>
            <StyledCoOccurrenceChevron $expanded={expanded}>
              <IcoChevronDown size={10} />
            </StyledCoOccurrenceChevron>
            {entityIds.length}
            {entityIds.length === 1 ? " entity" : " entities"}
          </StyledCoOccurrenceToggle>
          <StyledCoOccurrenceClear
            type="button"
            aria-label="Clear co-occurrence filter"
            onClick={() => onChange([])}
          >
            <IcoCloseMd size={14} />
          </StyledCoOccurrenceClear>
        </StyledCoOccurrenceSummary>
      )}

      {expanded && entityIds.length > 0 && (
        <CoOccurrenceEntityList
          entityIds={entityIds}
          onRemove={(entityId) => onChange(entityIds.filter((id) => id !== entityId))}
        />
      )}
    </StyledCoOccurrenceBox>
  );
};
