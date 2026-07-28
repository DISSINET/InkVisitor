import { Occurrence } from "@inkvisitor/annotator/src/lib";
import { Button } from "components";
import React from "react";
import { IcoAnchor } from "Theme/icons";
import { AnnotatorFloatingPanel } from "../AnnotatorFloatingPanel/AnnotatorFloatingPanel";
import { AnnotatorFindControls } from "./AnnotatorFindControls";

interface AnnotatorFindPanel {
  onClose: () => void;
  onOpenSequentialAnchoring: () => void;
  /** False for a document the user may not edit — anchoring is unavailable. */
  canEdit: boolean;

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
}

export const AnnotatorFindPanel: React.FC<AnnotatorFindPanel> = ({
  onClose,
  onOpenSequentialAnchoring,
  canEdit,
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
}) => {
  return (
    <AnnotatorFloatingPanel title="Find" onClose={onClose} closeTooltipLabel="close find (Esc)">
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
        footerExtra={
          canEdit && (
            <Button
              label="Sequential anchoring"
              icon={<IcoAnchor />}
              color="info"
              onClick={onOpenSequentialAnchoring}
              tooltipLabel="anchor each match to one entity, one match at a time"
            />
          )
        }
      />
    </AnnotatorFloatingPanel>
  );
};
