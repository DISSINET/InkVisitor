import { Annotator, Occurrence } from "@inkvisitor/annotator/src/lib";
import { IDocument, IEntity } from "@inkvisitor/shared/types";
import { Button } from "components";
import { EntitySuggester } from "../../EntitySuggester/EntitySuggester";
import { EntityTag } from "../../EntityTag/EntityTag";
import React from "react";
import { useTheme } from "styled-components";
import { IcoAnchor, IcoAnchorCheck, IcoChevronLeft } from "Theme/icons";
import { AnnotatorFloatingPanel } from "../AnnotatorFloatingPanel/AnnotatorFloatingPanel";
import { useDocumentContentSave } from "../hooks/useDocumentContentSave";
import { AnnotatorFindControls } from "./AnnotatorFindControls";
import { StyledFindReplaceFooter, StyledFindReplaceRow } from "./AnnotatorFindReplaceModalStyles";

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

  entityToAnchor: IEntity | null;
  setEntityToAnchor: (entity: IEntity | null) => void;
  /** True when the active match is already wrapped in an anchor. */
  currentAnchorExist: boolean;
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
  entityToAnchor,
  setEntityToAnchor,
  currentAnchorExist,
  selectedText,
}) => {
  const theme = useTheme();

  const saveDocumentContent = useDocumentContentSave({
    annotator,
    documentId,
    dataDocument,
  });

  const hasResults = (searchOccurences?.length ?? 0) > 0;

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
        {entityToAnchor ? (
          <EntityTag
            entity={entityToAnchor}
            unlinkButton={{
              onClick: () => setEntityToAnchor(null),
            }}
          />
        ) : (
          <EntitySuggester
            placeholder="select entity"
            inputWidth="full"
            onPicked={(entity) => setEntityToAnchor(entity)}
          />
        )}
      </StyledFindReplaceRow>

      <StyledFindReplaceFooter>
        {currentAnchorExist ? (
          <IcoAnchorCheck size={16} color={theme.color.info} title="anchor exists" />
        ) : (
          <Button
            label="Anchor & next"
            icon={<IcoAnchor />}
            color="success"
            tooltipLabel="wrap the selection in an anchor for the given entity and go to the next match"
            disabled={!hasResults || !entityToAnchor || selectedText.length === 0}
            onClick={() => {
              if (entityToAnchor) {
                annotator?.addAnchor(entityToAnchor.id);
                saveDocumentContent("Anchor saved");
                goToNextOccurence();
              }
            }}
          />
        )}
      </StyledFindReplaceFooter>
    </AnnotatorFloatingPanel>
  );
};
