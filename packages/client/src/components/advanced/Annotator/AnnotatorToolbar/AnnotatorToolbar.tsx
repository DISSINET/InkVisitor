import { EditMode } from "@inkvisitor/annotator/src/lib";
import { Button, Loader } from "components";
import { SwitchGroup } from "components/basic/ButtonGroup/ButtonGroup";
import React, { ReactNode } from "react";
import { BsFileTextFill } from "react-icons/bs";
import { FaHighlighter, FaRegSave } from "react-icons/fa";
import { HiCodeBracket } from "react-icons/hi2";
import { useTheme } from "styled-components";
import { IcoUndo } from "Theme/icons";
import {
  StyledAnnotatorToolbar,
  StyledAnnotatorToolbarButtonWrap,
  StyledAnnotatorToolbarGroup,
  StyledDisplayModeButtonIconWrapper,
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

  /** Warnings chip, when this host has not supplied its own. */
  warningChip?: ReactNode;
  /** Host-specific controls — highlight classes, locate anchor, warnings. */
  toolbarExtras?: ReactNode;
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
  warningChip,
  toolbarExtras,
}) => {
  const theme = useTheme();

  const modeButton = (mode: EditMode, icon: ReactNode, tooltipLabel: string) => (
    <Button
      key={mode}
      icon={<StyledDisplayModeButtonIconWrapper>{icon}</StyledDisplayModeButtonIconWrapper>}
      color="success"
      shape="rounded-sm"
      noBorder
      inverted={annotatorMode !== mode}
      noBackground={annotatorMode !== mode}
      bold={annotatorMode === mode}
      onClick={() => onModeClick(mode)}
      tooltipLabel={tooltipLabel}
      tooltipPosition="top"
    />
  );

  return (
    <StyledAnnotatorToolbar>
      <SwitchGroup $bgColor={theme.color.invertedBg.success}>
        {modeButton(EditMode.HIGHLIGHT, <FaHighlighter size={11} />, "anchor entities")}
        {modeButton(
          EditMode.SEMI,
          <BsFileTextFill size={11} />,
          canEditDocument ? "edit plain text" : "view plain text",
        )}
        {modeButton(
          EditMode.RAW,
          <HiCodeBracket size={11} />,
          canEditDocument ? "display and edit XML" : "display XML",
        )}
      </SwitchGroup>

      {warningChip}

      {toolbarExtras && (
        <StyledAnnotatorToolbarGroup>{toolbarExtras}</StyledAnnotatorToolbarGroup>
      )}

      {editActionsVisible && (
        <StyledAnnotatorToolbarGroup>
          <Button
            color="greyer"
            inverted
            icon={<IcoUndo />}
            disabled={editActionsDisabled}
            onClick={onDiscard}
            tooltipLabel="discard unsaved changes"
            tooltipPosition="top"
          />
          <StyledAnnotatorToolbarButtonWrap>
            <Button
              color="info"
              icon={<FaRegSave size={14} />}
              disabled={editActionsDisabled}
              onClick={onSave}
              tooltipLabel="save document (Ctrl+S)"
              tooltipPosition="top"
            />
            <Loader show={isSavePending} size={14} />
          </StyledAnnotatorToolbarButtonWrap>
        </StyledAnnotatorToolbarGroup>
      )}
    </StyledAnnotatorToolbar>
  );
};
