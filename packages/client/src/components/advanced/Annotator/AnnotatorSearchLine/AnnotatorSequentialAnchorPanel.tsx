import { Annotator, Occurrence } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button, Submit } from "components";
import React, { useState } from "react";
import { useTheme } from "styled-components";
import { IcoAnchor, IcoAnchorCheck, IcoChevronLeft } from "Theme/icons";
import { getEntityLabel } from "utils/utils";
import { AnnotatorFloatingPanel } from "../AnnotatorFloatingPanel/AnnotatorFloatingPanel";
import { useDocumentContentSave } from "../hooks/useDocumentContentSave";
import { isForeignLanguageEntity } from "../utils/anchorElvl";
import { AnnotatorEntityMultiPicker } from "./AnnotatorEntityMultiPicker";
import { AnnotatorFindControls } from "./AnnotatorFindControls";
import { entityIdsToAnchor } from "./anchorUtils";
import {
  StyledFindReplaceFooter,
  StyledFindReplaceFooterInfo,
  StyledFindReplaceRow,
} from "./AnnotatorFindReplaceModalStyles";

interface AnnotatorSequentialAnchorPanel {
  onClose: () => void;
  onBack: () => void;

  annotator: Annotator | null;
  documentId?: string;
  dataDocument?: IDocument;

  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
  findInputRef: React.RefObject<HTMLInputElement | null>;

  searchOccurences: Occurrence[] | null;
  searchActiveOccurence: number;
  goToNextOccurence: () => void;
  goToPreviousOccurence: () => void;

  isCaseSensitiveMode: boolean;
  setIsCaseSensitiveMode: React.Dispatch<React.SetStateAction<boolean>>;
  isExtendToWholeWordMode: boolean;
  setIsExtendToWholeWordMode: React.Dispatch<React.SetStateAction<boolean>>;
  isRegexMode: boolean;
  setIsRegexMode: React.Dispatch<React.SetStateAction<boolean>>;

  entitiesToAnchor: IEntity[];
  onPickEntityToAnchor: (entity: IEntity) => void;
  onRemoveEntityToAnchor: (entityId: string) => void;
  /** Tag names of the anchors already wrapping the active match. */
  selectedAnchorTagNames: string[];
  selectedText: string;
  /** The user's default source language; picked entities in another language get inferential anchors. */
  sourceLanguage?: EntityEnums.Language;
}

export const AnnotatorSequentialAnchorPanel: React.FC<AnnotatorSequentialAnchorPanel> = ({
  onClose,
  onBack,
  annotator,
  documentId = undefined,
  dataDocument,
  searchTerm,
  setSearchTerm,
  findInputRef,
  searchOccurences,
  searchActiveOccurence,
  goToNextOccurence,
  goToPreviousOccurence,
  isCaseSensitiveMode,
  setIsCaseSensitiveMode,
  isExtendToWholeWordMode,
  setIsExtendToWholeWordMode,
  isRegexMode,
  setIsRegexMode,
  entitiesToAnchor,
  onPickEntityToAnchor,
  onRemoveEntityToAnchor,
  selectedAnchorTagNames,
  selectedText,
  sourceLanguage,
}) => {
  const theme = useTheme();

  const saveDocumentContent = useDocumentContentSave({
    annotator,
    documentId,
    dataDocument,
  });

  const hasResults = (searchOccurences?.length ?? 0) > 0;

  const idsToAnchor = entityIdsToAnchor(
    entitiesToAnchor.map((entity) => entity.id),
    selectedAnchorTagNames
  );
  const allAlreadyAnchored = entitiesToAnchor.length > 0 && idsToAnchor.length === 0;

  // the user confirms each foreign-language entity once while the panel is open
  const [confirmedForeignIds, setConfirmedForeignIds] = useState<string[]>([]);
  const [showForeignSubmit, setShowForeignSubmit] = useState(false);

  const foreignEntities = entitiesToAnchor.filter((entity) =>
    isForeignLanguageEntity(entity, sourceLanguage)
  );
  const foreignIds = new Set(foreignEntities.map((entity) => entity.id));
  const unconfirmedForeignEntities = foreignEntities.filter(
    (entity) => !confirmedForeignIds.includes(entity.id)
  );
  const unconfirmedForeignList = unconfirmedForeignEntities
    .map((entity) => `${getEntityLabel(entity)} (${entity.language})`)
    .join(", ");

  const anchorAndNext = () => {
    // each addAnchor re-selects the span it wrapped, so the calls nest
    // and the first id becomes the outermost tag
    idsToAnchor.forEach((entityId) =>
      annotator?.addAnchor(
        entityId,
        foreignIds.has(entityId) ? { elvl: EntityEnums.Elvl.Inferential } : undefined
      )
    );
    saveDocumentContent("Anchor saved");
    goToNextOccurence();
  };

  return (
    <AnnotatorFloatingPanel
      title="Sequential anchoring"
      onClose={onClose}
      closeTooltipLabel="close sequential anchoring (Esc)"
      onBack={onBack}
      backTooltipLabel="back to search"
    >
      <AnnotatorFindControls
        onClose={onClose}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        findInputRef={findInputRef}
        searchOccurences={searchOccurences}
        searchActiveOccurence={searchActiveOccurence}
        goToNextOccurence={goToNextOccurence}
        goToPreviousOccurence={goToPreviousOccurence}
        isCaseSensitiveMode={isCaseSensitiveMode}
        setIsCaseSensitiveMode={setIsCaseSensitiveMode}
        isExtendToWholeWordMode={isExtendToWholeWordMode}
        setIsExtendToWholeWordMode={setIsExtendToWholeWordMode}
        isRegexMode={isRegexMode}
        setIsRegexMode={setIsRegexMode}
      />

      <StyledFindReplaceRow>
        <AnnotatorEntityMultiPicker
          entities={entitiesToAnchor}
          onPick={onPickEntityToAnchor}
          onRemove={onRemoveEntityToAnchor}
        />
      </StyledFindReplaceRow>

      <StyledFindReplaceFooter>
        {allAlreadyAnchored ? (
          <StyledFindReplaceFooterInfo>
            {entitiesToAnchor.length === 1
              ? "this match is already anchored"
              : "this match already has all the anchors"}
            <IcoAnchorCheck size={16} color={theme.color.info} />
          </StyledFindReplaceFooterInfo>
        ) : (
          <Button
            label="Anchor & next"
            icon={<IcoAnchor />}
            color="success"
            tooltipLabel="wrap the selection in an anchor for each given entity and go to the next match"
            disabled={!hasResults || idsToAnchor.length === 0 || selectedText.length === 0}
            onClick={() => {
              if (unconfirmedForeignEntities.length > 0) {
                setShowForeignSubmit(true);
              } else {
                anchorAndNext();
              }
            }}
          />
        )}
      </StyledFindReplaceFooter>

      <Submit
        title="Language mismatch"
        text={`The language of ${unconfirmedForeignList} does not correspond with the user statement language (${sourceLanguage}). ${unconfirmedForeignEntities.length === 1 ? "Its anchors" : "Their anchors"} will get the epistemic level "inferential".`}
        show={showForeignSubmit}
        onSubmit={() => {
          setConfirmedForeignIds((prevIds) => [
            ...prevIds,
            ...unconfirmedForeignEntities.map((entity) => entity.id),
          ]);
          setShowForeignSubmit(false);
          anchorAndNext();
        }}
        onCancel={() => setShowForeignSubmit(false)}
        submitLabel="Anchor & next"
        submitColor="success"
      />
    </AnnotatorFloatingPanel>
  );
};
