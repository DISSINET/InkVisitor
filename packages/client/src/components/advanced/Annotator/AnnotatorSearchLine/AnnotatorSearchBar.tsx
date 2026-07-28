import { EditMode, Occurrence } from "@inkvisitor/annotator/src/lib";
import { Button, Checkbox, Input } from "components";
import React from "react";
import { FaTimes } from "react-icons/fa";
import {
  IcoAnchor,
  IcoArrowCircleDown,
  IcoArrowCircleUp,
  IcoCaseSensitive,
  IcoExpandFull,
  IcoRegex,
  IcoReplaceTb,
  IcoWholeWord,
} from "Theme/icons";
import {
  StyledAnnotatorSearchBar,
  StyledSearchBarFlags,
  StyledSearchBarNav,
  StyledSearchBarResults,
} from "./AnnotatorSearchBarStyles";

interface AnnotatorSearchBar {
  annotatorMode: EditMode;
  onClose: () => void;
  /** Opens the mode's second step — sequential anchoring, or find & replace. */
  onOpenSecondStep: () => void;
  /** False for a document the user may not edit: no anchoring, no replacing. */
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
  isWholeWordOnlyMode: boolean;
  setIsWholeWordOnlyMode: React.Dispatch<React.SetStateAction<boolean>>;
  isRegexMode: boolean;
  setIsRegexMode: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * First step of search: a compact bar over the top-right of the canvas holding
 * the query, its flags and the occurrence navigation. What to DO with a match
 * is the second step, and differs by mode, so it opens a panel of its own.
 */
export const AnnotatorSearchBar: React.FC<AnnotatorSearchBar> = ({
  annotatorMode,
  onClose,
  onOpenSecondStep,
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
  isWholeWordOnlyMode,
  setIsWholeWordOnlyMode,
  isRegexMode,
  setIsRegexMode,
}) => {
  const occurencesCount = searchOccurences?.length ?? 0;
  const isHighlightMode = annotatorMode === EditMode.HIGHLIGHT;

  // Keeping focus in the query field means the flag toggles can be used without
  // breaking a typing run.
  const refocusInput = () => findInputRef.current?.focus();

  return (
    <StyledAnnotatorSearchBar>
      <Input
        value={searchTerm}
        onChangeFn={(newText: string) => setSearchTerm(newText)}
        onEnterPressFn={goToNextOccurence}
        onEscapePressFn={onClose}
        changeOnType
        autoFocus
        width={200}
        inputRef={findInputRef}
        roundCorners
        placeholder="search"
        rightContent={
          <StyledSearchBarFlags>
            <Checkbox
              iconOnly
              value={isCaseSensitiveMode}
              onChangeFn={setIsCaseSensitiveMode}
              onClickFn={refocusInput}
              icon={<IcoCaseSensitive size={16} />}
              tooltipLabel="match case"
              tooltipPosition="bottom"
            />
            {isHighlightMode ? (
              <Checkbox
                iconOnly
                value={isExtendToWholeWordMode}
                onChangeFn={setIsExtendToWholeWordMode}
                onClickFn={refocusInput}
                icon={<IcoExpandFull size={12} />}
                tooltipLabel="extend to whole word(s)"
                tooltipPosition="bottom"
              />
            ) : (
              <Checkbox
                iconOnly
                value={isWholeWordOnlyMode}
                onChangeFn={setIsWholeWordOnlyMode}
                onClickFn={refocusInput}
                icon={<IcoWholeWord size={16} />}
                tooltipLabel="whole word only"
                tooltipPosition="bottom"
              />
            )}
            <Checkbox
              iconOnly
              value={isRegexMode}
              onChangeFn={setIsRegexMode}
              onClickFn={refocusInput}
              icon={<IcoRegex size={14} />}
              tooltipLabel="use regular expressions"
              tooltipPosition="bottom"
            />
          </StyledSearchBarFlags>
        }
      />

      <StyledSearchBarResults>
        {searchOccurences === null
          ? ""
          : occurencesCount === 0
            ? "no results"
            : `${searchActiveOccurence + 1} of ${occurencesCount}`}
      </StyledSearchBarResults>

      <StyledSearchBarNav>
        <Button
          icon={<IcoArrowCircleUp />}
          color="info"
          inverted
          noBorder
          onClick={goToPreviousOccurence}
          disabled={occurencesCount === 0}
          tooltipLabel="previous occurence"
          tooltipContent={<p>(Shift + F3)</p>}
          tooltipPosition="bottom"
        />
        <Button
          icon={<IcoArrowCircleDown />}
          color="info"
          inverted
          noBorder
          onClick={goToNextOccurence}
          disabled={occurencesCount === 0}
          tooltipLabel="next occurence"
          tooltipContent={<p>(F3)</p>}
          tooltipPosition="bottom"
        />
      </StyledSearchBarNav>

      {canEdit && (
        <Button
          icon={isHighlightMode ? <IcoAnchor /> : <IcoReplaceTb />}
          color="info"
          onClick={onOpenSecondStep}
          tooltipLabel={
            isHighlightMode
              ? "anchor each match to one entity, one match at a time"
              : "open find & replace"
          }
          tooltipPosition="bottom"
        />
      )}

      <Button
        icon={<FaTimes size={12} />}
        color="primary"
        inverted
        noBorder
        noBackground
        onClick={onClose}
        tooltipLabel="close search (Esc)"
        tooltipPosition="bottom"
      />
    </StyledAnnotatorSearchBar>
  );
};
