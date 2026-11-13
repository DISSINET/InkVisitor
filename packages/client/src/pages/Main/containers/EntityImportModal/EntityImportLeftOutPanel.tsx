import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import React from "react";
import {
  StyledAppendPanel,
  StyledAppendRow,
  StyledAppendRowLabel,
  StyledAppendSection,
  StyledAppendText,
} from "./EntityImportModalStyles";

interface EntityImportLeftOutPanel {
  entity: IEntity;
  // every left-out draft with the draft that is the reason, see leftOutDrafts
  leftOut: Map<string, string>;
  labelOf: (entityId: string) => string;
  onToggleLeftOut: (entityId: string) => void;
  onSelect: (entityId: string) => void;
}

/**
 * Beside the Detail of a left-out draft: why it is left out, the way back,
 * and the drafts left out with it.
 */
export const EntityImportLeftOutPanel: React.FC<EntityImportLeftOutPanel> = ({
  entity,
  leftOut,
  labelOf,
  onToggleLeftOut,
  onSelect,
}) => {
  const reason = leftOut.get(entity.id);

  if (reason && reason !== entity.id) {
    return (
      <StyledAppendPanel>
        <StyledAppendSection>
          <StyledAppendText>
            {entity.class === EntityEnums.Class.Value
              ? `Left out of the import: only left-out drafts use it, such as "${labelOf(reason)}".`
              : `Left out of the import: it points at "${labelOf(reason)}", which is left out.`}
          </StyledAppendText>
          <Button
            label={`show "${labelOf(reason)}"`}
            inverted
            color="primary"
            onClick={() => onSelect(reason)}
          />
        </StyledAppendSection>
      </StyledAppendPanel>
    );
  }

  const dependents = [...leftOut]
    .filter(([entityId, cause]) => cause === entity.id && entityId !== entity.id)
    .map(([entityId]) => entityId);

  return (
    <StyledAppendPanel>
      <StyledAppendSection>
        <StyledAppendText>{"Left out of the import."}</StyledAppendText>
        <Button
          label="bring back"
          inverted
          color="primary"
          onClick={() => onToggleLeftOut(entity.id)}
        />
      </StyledAppendSection>
      {dependents.length > 0 && (
        <StyledAppendSection>
          <StyledAppendRowLabel>{"Also left out, as they point at it:"}</StyledAppendRowLabel>
          {dependents.map((entityId) => (
            <StyledAppendRow key={entityId}>
              <Button label={labelOf(entityId)} inverted onClick={() => onSelect(entityId)} />
            </StyledAppendRow>
          ))}
        </StyledAppendSection>
      )}
    </StyledAppendPanel>
  );
};
