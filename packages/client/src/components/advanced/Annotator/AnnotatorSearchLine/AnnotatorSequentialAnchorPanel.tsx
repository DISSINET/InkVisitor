import { Annotator, Occurrence } from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import React from "react";
import { useTheme } from "styled-components";
import { IcoAnchor, IcoAnchorCheck, IcoChevronLeft } from "Theme/icons";
import { AnnotatorFloatingPanel } from "../AnnotatorFloatingPanel/AnnotatorFloatingPanel";
import { useDocumentContentSave } from "../hooks/useDocumentContentSave";
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
              // each addAnchor re-selects the span it wrapped, so the calls nest
              // and the first id becomes the outermost tag
              idsToAnchor.forEach((entityId) => annotator?.addAnchor(entityId));
              saveDocumentContent("Anchor saved");
              goToNextOccurence();
            }}
          />
        )}
      </StyledFindReplaceFooter>
    </AnnotatorFloatingPanel>
  );
};
