import { EditMode } from "@inkvisitor/annotator/src/lib";
import { Button, Input, Loader } from "components";
import { SwitchGroup } from "components/basic/ButtonGroup/ButtonGroup";
import React, { ReactNode, useEffect, useState } from "react";
import { BsFileTextFill } from "react-icons/bs";
import { FaHighlighter, FaRegSave } from "react-icons/fa";
import { HiCodeBracket } from "react-icons/hi2";
import { useTheme } from "styled-components";
import { ButtonSize } from "types";
import { IcoListNumbered, IcoSearch, IcoUndo } from "Theme/icons";
import {
  StyledAnnotatorToolbar,
  StyledAnnotatorToolbarButtonWrap,
  StyledAnnotatorToolbarCluster,
  StyledAnnotatorToolbarGroup,
  StyledDisplayModeButtonIconWrapper,
  StyledGoToParagraphField,
  TOOLBAR_ICON_SIZE,
} from "./AnnotatorToolbarStyles";

interface AnnotatorToolbar {
  annotatorMode: EditMode;
  onModeClick: (mode: EditMode) => void;
  canEditDocument: boolean;

  editActionsVisible: boolean;
  editActionsDisabled: boolean;
  onDiscard: () => void;
  onSave: () => void;
  isSavePending: boolean;

  isSearchAllowed: boolean;
  onFindClick: () => void;

  /** While open, the go-to-paragraph button is replaced by its number field. */
  isGoToParagraphOpen: boolean;
  onGoToParagraphClick: () => void;
  onGoToParagraphClose: () => void;
  /** Receives the typed text as is; the host parses it and reports bad input. */
  onGoToParagraph: (input: string) => void;
  goToParagraphInputRef: React.RefObject<HTMLInputElement | null>;

  /** Warnings chip, when this host has not supplied its own. */
  warningChip?: ReactNode;
  /**
   * Host-specific controls — highlight classes, locate anchor, warnings.
   * Receives the mode so a host can scope a control to the mode it applies to.
   */
  toolbarExtras?: (annotatorMode: EditMode) => ReactNode;
}

export const AnnotatorToolbar: React.FC<AnnotatorToolbar> = ({
  annotatorMode,
  onModeClick,
  canEditDocument,
  editActionsVisible,
  editActionsDisabled,
  onDiscard,
  onSave,
  isSavePending,
  isSearchAllowed,
  onFindClick,
  isGoToParagraphOpen,
  onGoToParagraphClick,
  onGoToParagraphClose,
  onGoToParagraph,
  goToParagraphInputRef,
  warningChip,
  toolbarExtras,
}) => {
  const theme = useTheme();
  const [paragraphInput, setParagraphInput] = useState("");

  // The field starts empty each time it opens.
  useEffect(() => {
    if (!isGoToParagraphOpen) {
      setParagraphInput("");
    }
  }, [isGoToParagraphOpen]);

  const modeButton = (mode: EditMode, icon: ReactNode, tooltipLabel: string) => (
    <Button
      key={mode}
      size={ButtonSize.Small}
      icon={<StyledDisplayModeButtonIconWrapper>{icon}</StyledDisplayModeButtonIconWrapper>}
      color="success"
      shape="rounded-sm"
      noBorder
      inverted
      noBackground
      textColor={annotatorMode === mode ? "white" : undefined}
      noHoverBackground={annotatorMode === mode}
      textRegular={annotatorMode !== mode}
      onClick={() => onModeClick(mode)}
      tooltipLabel={tooltipLabel}
      tooltipPosition="top"
    />
  );

  return (
    <StyledAnnotatorToolbar>
      <StyledAnnotatorToolbarCluster>
        <SwitchGroup
          $bgColor={theme.color.invertedBg.success}
          pillColor="success"
          activeIndex={[EditMode.HIGHLIGHT, EditMode.SEMI, EditMode.RAW].indexOf(annotatorMode)}
        >
          {modeButton(EditMode.HIGHLIGHT, <FaHighlighter size={TOOLBAR_ICON_SIZE} />, "anchor entities")}
          {modeButton(
            EditMode.SEMI,
            <BsFileTextFill size={TOOLBAR_ICON_SIZE} />,
            canEditDocument ? "edit plain text" : "view plain text",
          )}
          {modeButton(
            EditMode.RAW,
            <HiCodeBracket size={TOOLBAR_ICON_SIZE} />,
            canEditDocument ? "display and edit XML" : "display XML",
          )}
        </SwitchGroup>
      </StyledAnnotatorToolbarCluster>

      <StyledAnnotatorToolbarCluster>
        {isSearchAllowed &&
          (isGoToParagraphOpen ? (
            // Escape only closes the field; past it, a modal or the annotator would act on it too
            <StyledGoToParagraphField onKeyDown={(e) => e.key === "Escape" && e.stopPropagation()}>
              {/* A text field, because the number field's stepper buttons take focus and close it */}
              <Input
                width={80}
                value={paragraphInput}
                changeOnType
                inputRef={goToParagraphInputRef}
                placeholder="paragraph"
                onChangeFn={setParagraphInput}
                onEnterPressFn={() => onGoToParagraph(paragraphInput)}
                onEscapePressFn={onGoToParagraphClose}
                onBlur={onGoToParagraphClose}
              />
            </StyledGoToParagraphField>
          ) : (
            <Button
              size={ButtonSize.Small}
              icon={<IcoListNumbered size={TOOLBAR_ICON_SIZE} />}
              color="info"
              inverted
              onClick={onGoToParagraphClick}
              tooltipLabel="go to paragraph (Ctrl+G)"
              tooltipPosition="top"
            />
          ))}

        {isSearchAllowed && (
          <Button
            size={ButtonSize.Small}
            icon={<IcoSearch size={TOOLBAR_ICON_SIZE} />}
            color="info"
            inverted
            onClick={onFindClick}
            tooltipLabel={
              annotatorMode === EditMode.HIGHLIGHT ? "find (Ctrl+F)" : "find & replace (Ctrl+F)"
            }
            tooltipPosition="top"
          />
        )}

        {warningChip}

        {toolbarExtras && (
          <StyledAnnotatorToolbarGroup>{toolbarExtras(annotatorMode)}</StyledAnnotatorToolbarGroup>
        )}

        {editActionsVisible && (
          <StyledAnnotatorToolbarGroup>
            <Button
              size={ButtonSize.Small}
              shape="square"
              color="greyer"
              inverted
              icon={<IcoUndo size={TOOLBAR_ICON_SIZE} />}
              disabled={editActionsDisabled}
              onClick={onDiscard}
              tooltipLabel="discard unsaved changes"
              tooltipPosition="top"
            />
            <StyledAnnotatorToolbarButtonWrap>
              <Button
                size={ButtonSize.Small}
                shape="square"
                color="info"
                icon={<FaRegSave size={TOOLBAR_ICON_SIZE} />}
                disabled={editActionsDisabled}
                onClick={onSave}
                tooltipLabel="save document (Ctrl+S)"
                tooltipPosition="top"
              />
              <Loader show={isSavePending} size={14} />
            </StyledAnnotatorToolbarButtonWrap>
          </StyledAnnotatorToolbarGroup>
        )}
      </StyledAnnotatorToolbarCluster>
    </StyledAnnotatorToolbar>
  );
};
