import { entityStatusDict, languageDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React from "react";
import { describeSkips, ImportDraft } from "utils/entityImport";
import {
  StyledAppendHeading,
  StyledAppendPanel,
  StyledAppendRow,
  StyledAppendRowLabel,
  StyledAppendSection,
  StyledAppendText,
  StyledConflictOption,
  StyledConflictSide,
} from "./EntityImportModalStyles";

// a Value is always created, never appended
export const canAppend = (entity: IEntity) => entity.class !== EntityEnums.Class.Value;

interface EntityImportAppendPanel {
  draft: ImportDraft;
  entity: IEntity;
  // database entities that may be this draft; undefined while searching
  candidates: IEntity[] | undefined;
  // the search for candidates failed, so no list says nothing about duplicates
  searchFailed: boolean;
  onSearchAgain: () => void;
  onConflictChoice: (conflictIndex: number, useImported: boolean) => void;
  onAppendTo: (storedId: string) => void;
  // given for a draft appended in the tabs
  onUndoAppend?: () => void;
}

/**
 * Beside the Detail of a draft: for an appended draft what was skipped and
 * the conflicts to settle, for a new one the database entities it may
 * duplicate, each of which it can be appended to instead.
 */
export const EntityImportAppendPanel: React.FC<EntityImportAppendPanel> = ({
  draft,
  entity,
  candidates,
  searchFailed,
  onSearchAgain,
  onConflictChoice,
  onAppendTo,
  onUndoAppend,
}) => {
  const append = draft.appends?.[entity.id];

  if (!canAppend(entity)) {
    return (
      <StyledAppendPanel>
        <StyledAppendText>{"A Value is always created new, never appended."}</StyledAppendText>
      </StyledAppendPanel>
    );
  }

  if (append) {
    const skipped = describeSkips(append.skipped);
    // a language and a status show by their names, as Detail shows them
    const shown = (path: string, value: string) =>
      (path === "language"
        ? languageDict.find((language) => language.value === value)?.label
        : path === "status"
          ? entityStatusDict.find((status) => status.value === value)?.label
          : undefined) ?? value;
    return (
      <StyledAppendPanel>
        {append.conflicts.length > 0 && (
          <>
            <StyledAppendHeading>
              {`Conflicts (${append.conflicts.length}): pick what to keep`}
            </StyledAppendHeading>
            {append.conflicts.map((conflict, conflictIndex) => (
              <StyledAppendSection key={conflict.path}>
                <StyledAppendRowLabel>{conflict.label}</StyledAppendRowLabel>
                {[false, true].map((useImported) => (
                  <StyledConflictOption
                    key={String(useImported)}
                    type="button"
                    $selected={conflict.useImported === useImported}
                    aria-pressed={conflict.useImported === useImported}
                    onClick={() => onConflictChoice(conflictIndex, useImported)}
                  >
                    <StyledConflictSide>{useImported ? "import" : "stored"}</StyledConflictSide>
                    {shown(conflict.path, useImported ? conflict.imported : conflict.stored)}
                  </StyledConflictOption>
                ))}
              </StyledAppendSection>
            ))}
          </>
        )}
        <StyledAppendSection>
          <StyledAppendText>
            {`Appends to "${append.stored.labels[0]}" in the database.`}
          </StyledAppendText>
          {onUndoAppend && (
            <Button label="undo append" inverted color="primary" onClick={onUndoAppend} />
          )}
        </StyledAppendSection>
        <StyledAppendSection>
          {skipped && (
            <>
              <StyledAppendRowLabel>{"Already stored, skipped:"}</StyledAppendRowLabel>
              <StyledAppendText>{skipped}</StyledAppendText>
            </>
          )}
          <StyledAppendRowLabel>{"Detail shows only its new relations."}</StyledAppendRowLabel>
        </StyledAppendSection>
      </StyledAppendPanel>
    );
  }

  const isDraft = (entityId: string) => draft.entities.some((candidate) => candidate.id === entityId);

  return (
    <StyledAppendPanel>
      {searchFailed && (
        <StyledAppendSection>
          <StyledAppendText>
            {"The search for this entity in the database failed."}
          </StyledAppendText>
          <StyledAppendRow>
            <Button label="search again" inverted color="primary" onClick={onSearchAgain} />
          </StyledAppendRow>
        </StyledAppendSection>
      )}
      {candidates && candidates.length > 0 && (
        <StyledAppendSection>
          <StyledAppendRowLabel>{"Possibly already in the database:"}</StyledAppendRowLabel>
          {candidates.map((candidate) => (
            <StyledAppendRow key={candidate.id}>
              <EntityTag entity={candidate} />
              <Button
                label="append to it"
                inverted
                color="primary"
                onClick={() => onAppendTo(candidate.id)}
              />
            </StyledAppendRow>
          ))}
        </StyledAppendSection>
      )}
      <StyledAppendSection>
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
      </StyledAppendSection>
    </StyledAppendPanel>
  );
};
