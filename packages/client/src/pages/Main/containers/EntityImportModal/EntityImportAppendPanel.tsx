import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { AttributeButtonGroup, EntitySuggester, EntityTag } from "components/advanced";
import React from "react";
import { describeSkips, ImportDraft } from "utils/entityImport";
import {
  StyledAppendPanel,
  StyledAppendRow,
  StyledAppendRowLabel,
  StyledAppendText,
} from "./EntityImportModalStyles";

interface EntityImportAppendPanel {
  draft: ImportDraft;
  entity: IEntity;
  // database entities that may be this draft; undefined while searching
  candidates: IEntity[] | undefined;
  onConflictChoice: (conflictIndex: number, useImported: boolean) => void;
  onAppendTo: (storedId: string) => void;
}

/**
 * Above the Detail of a draft: for an appended draft what was skipped and the
 * conflicts to settle, for a new one the database entities it may duplicate,
 * each of which it can be appended to instead.
 */
export const EntityImportAppendPanel: React.FC<EntityImportAppendPanel> = ({
  draft,
  entity,
  candidates,
  onConflictChoice,
  onAppendTo,
}) => {
  const append = draft.appends?.[entity.id];

  if (append) {
    const skipped = describeSkips(append.skipped);
    return (
      <StyledAppendPanel>
        <StyledAppendText>
          {`Appends to "${append.stored.labels[0]}" in the database. Detail shows the stored entity with what the import adds; of its relations, only the new ones.`}
        </StyledAppendText>
        {skipped && <StyledAppendText>{`Already stored, skipped: ${skipped}.`}</StyledAppendText>}
        {append.conflicts.map((conflict, conflictIndex) => (
          <StyledAppendRow key={conflict.path}>
            <StyledAppendRowLabel>{`${conflict.label}:`}</StyledAppendRowLabel>
            <AttributeButtonGroup
              noMargin
              options={[
                {
                  longValue: `stored: ${conflict.stored}`,
                  shortValue: "stored",
                  onClick: () => onConflictChoice(conflictIndex, false),
                  selected: !conflict.useImported,
                },
                {
                  longValue: `import: ${conflict.imported}`,
                  shortValue: "import",
                  onClick: () => onConflictChoice(conflictIndex, true),
                  selected: conflict.useImported,
                },
              ]}
            />
          </StyledAppendRow>
        ))}
      </StyledAppendPanel>
    );
  }

  const isDraft = (entityId: string) => draft.entities.some((candidate) => candidate.id === entityId);

  return (
    <StyledAppendPanel>
      {candidates && candidates.length > 0 && (
        <StyledAppendRow>
          <StyledAppendRowLabel>{"Possibly already in the database:"}</StyledAppendRowLabel>
          {candidates.map((candidate) => (
            <React.Fragment key={candidate.id}>
              <EntityTag entity={candidate} />
              <Button
                label="append to it"
                inverted
                color="primary"
                onClick={() => onAppendTo(candidate.id)}
              />
            </React.Fragment>
          ))}
        </StyledAppendRow>
      )}
      <StyledAppendRow>
        <StyledAppendRowLabel>{"Append to a database entity instead:"}</StyledAppendRowLabel>
        <EntitySuggester
          categoryTypes={[entity.class]}
          disableCreate
          disableTemplatesAccept
          reuseDroppedValue
          placeholder="pick the entity"
          onPicked={(picked) => {
            if (!isDraft(picked.id)) {
              onAppendTo(picked.id);
            }
          }}
        />
      </StyledAppendRow>
    </StyledAppendPanel>
  );
};
