import { Occurrence } from "@inkvisitor/annotator/src/lib";
import { Button, Checkbox, Input } from "components";
import React from "react";
import {
  StyledFindReplaceFlags,
  StyledFindReplaceFooter,
  StyledFindReplaceResults,
  StyledFindReplaceRow,
  StyledNoResults,
} from "./AnnotatorFindReplaceModalStyles";

interface AnnotatorFindControls {
  onClose: () => void;

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

/**
 * The find input, its flag checkboxes and the Previous/Next footer — shared by
 * the plain find panel and the sequential anchoring panel, which search exactly
 * the same way and differ only in what they do with a match once found.
 */
export const AnnotatorFindControls: React.FC<AnnotatorFindControls> = ({
  onClose,
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
  const occurencesCount = searchOccurences?.length ?? 0;

  return (
    <>
      <StyledFindReplaceRow>
        <Input
          value={searchTerm}
          onChangeFn={(newText: string) => setSearchTerm(newText)}
          onEnterPressFn={goToNextOccurence}
          onEscapePressFn={onClose}
          changeOnType
          clearable
          autoFocus
          width="full"
          inputRef={findInputRef}
          placeholder="Find"
          rightContent={
            <StyledFindReplaceResults>
              {searchOccurences === null ? (
                ""
              ) : occurencesCount === 0 ? (
                <StyledNoResults>no results</StyledNoResults>
              ) : (
                `${searchActiveOccurence + 1} of ${occurencesCount}`
              )}
            </StyledFindReplaceResults>
          }
        />
      </StyledFindReplaceRow>

      <StyledFindReplaceFlags>
        <Checkbox
          label="Match case"
          value={isCaseSensitiveMode}
          onChangeFn={(checked: boolean) => setIsCaseSensitiveMode(checked)}
          size={13}
        />
        <Checkbox
          label="Extend to whole word(s)"
          value={isExtendToWholeWordMode}
          onChangeFn={(checked: boolean) => setIsExtendToWholeWordMode(checked)}
          size={13}
        />
        <Checkbox
          label="Use regular expressions"
          value={isRegexMode}
          onChangeFn={(checked: boolean) => setIsRegexMode(checked)}
          size={13}
        />
      </StyledFindReplaceFlags>

      <StyledFindReplaceFooter>
        <Button
          label="Previous"
          color="info"
          inverted
          tooltipLabel="previous occurence"
          tooltipContent={<p>(Shift + F3)</p>}
          onClick={goToPreviousOccurence}
          disabled={occurencesCount === 0}
        />
        <Button
          label="Next"
          color="info"
          inverted
          tooltipLabel="next occurence"
          tooltipContent={<p>(F3)</p>}
          onClick={goToNextOccurence}
          disabled={occurencesCount === 0}
        />
      </StyledFindReplaceFooter>
    </>
  );
};
