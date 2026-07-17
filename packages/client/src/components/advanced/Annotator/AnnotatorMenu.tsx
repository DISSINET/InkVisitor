import React, { useCallback, useEffect, useMemo, useState } from "react";
import { List } from "react-window";

import { AnchorOpenTagRef, MoveAnchorBoundaryResult, Tag } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseTerritory } from "@inkvisitor/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { ButtonGroup, IconWithTooltip, Loader, SwitchGroup } from "components";
import { Button } from "components/basic/Button/Button";
import { useSearchParams } from "hooks";
import useKeypress from "hooks/useKeyPress";
import {
  FaAnchor,
  FaBolt,
  FaCaretDown,
  FaChevronLeft,
  FaChevronRight,
  FaClipboard,
  FaExclamationTriangle,
  FaLongArrowAltRight,
  FaPen,
  FaPlus,
  FaRegEye,
} from "react-icons/fa";
import { MdDragIndicator, MdOutlineDone } from "react-icons/md";
import { PiCheckBold, PiSelectionFill } from "react-icons/pi";
import { RiExpandWidthLine } from "react-icons/ri";
import { TbAnchor } from "react-icons/tb";
import { toast } from "react-toastify";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { useAppDispatch } from "redux/hooks";
import { IcoTrash } from "Theme/icons";
import { ButtonSize, classesAnnotator } from "types";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import { EntityTagById } from "../EntityTag/EntityTagById";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import { TerritoryChildIcon, TerritorySiblingIcon } from "./AnnotatorIcons";
import {
  ANCHOR_GRID_COLUMNS,
  ANCHOR_GRID_ROW_HEIGHT,
  ANCHOR_GRID_ROW_MARGIN,
  AnnotatorAnchorGridRow,
  AnnotatorAnchorGridRowData,
  AnnotatorAnchorListItem,
} from "./AnnotatorMenuAnchorListRow";
import {
  StyledAnchorModeSwitch,
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorDoneButton,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenuDragHandle,
  StyledAnnotatorNoAnchors,
  StyledCaretButtonWrapper,
  StyledMoveAnchorControls,
  StyledMoveAnchorFooter,
  StyledMoveAnchorGroup,
  StyledMoveAnchorGroupLabel,
  StyledMoveAnchorPanel,
  StyledStatementSubsection,
  StyledStatementTargetArrow,
  StyledStatementTargetCurrent,
  StyledStatementTargetInfo,
  StyledTerritoryButtonColumn,
  StyledTerritorySubsection,
  StyledTerritorySubsectionTitle,
} from "./AnnotatorStyles";
import { AnnotatorPositionTNode, TerritoryCreateModalType } from "./types";
import { useAnnotatorTargetPicker } from "./useAnnotatorTargetPicker";

interface TextAnnotatorMenuProps {
  text: string;
  anchors: Tag[];
  entities: Record<string, IEntity | false>;
  onAnchorAdd: (entityId: string, elvl: EntityEnums.Elvl) => void;
  onCreateStatement?: (
    elvl: EntityEnums.Elvl,
    entityCreateModalProps?: {
      label: string;
      detail: string;
      territoryId: string;
      language: EntityEnums.Language;
    },
    targetTerritoryId?: string,
  ) => void;
  /**
   * The in-document subT (Territory anchor) hierarchy the current selection sits
   * inside, outermost first with nesting depth. Lets the user target the proper
   * subT for the new Statement, showing the chain from the highest subT owning
   * this document's text down to the deepest leaf at the cursor.
   */
  annotatorPositionHierarchy: AnnotatorPositionTNode[];
  onCreateTerritory?: (
    territoryCreateModalType: TerritoryCreateModalType,
    elvl: EntityEnums.Elvl,
    targetTerritoryId?: string,
  ) => void;
  onRemoveAnchor?: (anchor: Tag) => void;
  canCreateActiveTAnchor: boolean;
  onCreateActiveTAnchor?: (elvl: EntityEnums.Elvl) => void;
  activeTerritoryId: string | undefined;
  territory?: IResponseTerritory;
  onEscapePressed: () => void;
  disableCreate?: boolean;
  onUpdateAnchor?: (anchor: Tag, elvl: EntityEnums.Elvl) => void;

  /**
   * Moves one boundary of an anchored span by one character (#2885).
   * Undefined when the document is read-only. Returns the move result so the
   * menu can chain the returned openTagRef into the next click.
   */
  onMoveAnchorBoundary?: (
    tagName: string,
    openTagRef: AnchorOpenTagRef,
    boundary: "open" | "close",
    direction: -1 | 1,
  ) => MoveAnchorBoundaryResult | undefined;
  /** Called when move mode begins — the parent snapshots the text (for Discard) and starts the resize pulse. */
  onMoveAnchorBegin?: (tagName: string, openTagRef: AnchorOpenTagRef) => void;
  /** Scrolls the given boundary of the resized anchor into view (locate a long span's ends). */
  onLocateAnchorBoundary?: (boundary: "open" | "close") => void;
  /** Done: the parent saves the buffered series of moves. */
  onMoveAnchorSave?: () => void;
  /** Discard / cancel (Esc): the parent reverts the buffered moves. */
  onMoveAnchorDiscard?: () => void;

  /** View-only menu: hides anchor unlink/elvl controls (e.g. unassigned documents). */
  readonly?: boolean;

  isLoading: boolean;

  /** Pointer handlers for the top drag handle (menu repositioning). */
  menuDragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  onCreateStatement = undefined,
  annotatorPositionHierarchy,
  onCreateTerritory = undefined,
  onCreateActiveTAnchor = undefined,
  onRemoveAnchor = undefined,
  onUpdateAnchor = undefined,
  onMoveAnchorBoundary = undefined,
  onMoveAnchorBegin = undefined,
  onLocateAnchorBoundary = undefined,
  onMoveAnchorSave = undefined,
  onMoveAnchorDiscard = undefined,
  canCreateActiveTAnchor,
  activeTerritoryId,
  territory,
  onEscapePressed,
  disableCreate,
  readonly = false,

  isLoading = false,

  menuDragHandleProps,
}: TextAnnotatorMenuProps) => {
  const activeTerritory = entities[activeTerritoryId ?? ""];
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { setStatementId, setTerritoryId } = useSearchParams();

  // #2885 — non-null while an anchor span is being moved with the arrow
  // buttons; the menu body is replaced by the move panel. openTagRef is
  // refreshed from every successful move so repeated clicks track the anchor
  // across re-parses.
  const [movingAnchor, setMovingAnchor] = useState<{
    tagName: string;
    openTagRef: AnchorOpenTagRef;
  } | null>(null);

  const handleMoveAnchorStart = useCallback(
    (anchor: Tag) => {
      const openTagRef = {
        segmentIndex: anchor.segmentIndex,
        position: anchor.position,
      };
      onMoveAnchorBegin?.(anchor.getTagName(), openTagRef);
      setMovingAnchor({ tagName: anchor.getTagName(), openTagRef });
    },
    [onMoveAnchorBegin],
  );

  // Done commits the buffered series; Discard (and Esc) reverts it. Both leave
  // move mode back to the normal anchor menu.
  const finishMove = useCallback(
    (commit: boolean) => {
      if (commit) {
        onMoveAnchorSave?.();
      } else {
        onMoveAnchorDiscard?.();
      }
      setMovingAnchor(null);
    },
    [onMoveAnchorSave, onMoveAnchorDiscard],
  );

  const handleMoveClick = (boundary: "open" | "close", direction: -1 | 1) => {
    if (!movingAnchor || !onMoveAnchorBoundary) {
      return;
    }
    const result = onMoveAnchorBoundary(
      movingAnchor.tagName,
      movingAnchor.openTagRef,
      boundary,
      direction,
    );
    if (result?.status === "moved" && result.openTagRef) {
      setMovingAnchor({ ...movingAnchor, openTagRef: result.openTagRef });
    }
  };

  const movingEntity = movingAnchor ? entities[movingAnchor.tagName] || undefined : undefined;

  const tryCloseMenu = useCallback(() => {
    // Esc inside move mode cancels the buffered moves (revert); a second Esc
    // then closes the menu.
    if (movingAnchor) {
      finishMove(false);
      return;
    }
    const isModalOpen = document.querySelector('[data-attribute-modal="true"]') !== null;
    if (!isModalOpen) {
      onEscapePressed();
    }
  }, [onEscapePressed, movingAnchor, finishMove]);

  useKeypress("Escape", tryCloseMenu);
  useKeypress("Enter", tryCloseMenu, undefined, true);

  const [activeTerritoryElvl, setActiveTerritoryElvl] = useState<EntityEnums.Elvl>(
    EntityEnums.Elvl.Textual,
  );
  const [statementElvl, setStatementElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);
  const [suggesterElvl, setSuggesterElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);
  // While the suggester input is focused or hovered, the elvl group shows a
  // warning ring to remind the user to check the (pre-selected) epistemic level
  // before acting.
  const [suggesterFocused, setSuggesterFocused] = useState(false);
  const [suggesterHovered, setSuggesterHovered] = useState(false);
  const [territoryElvl, setTerritoryElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);

  // The deepest leaf subT at the cursor (smallest span = innermost) is the
  // "relevant" T and the default Statement target. The active T (opened in the
  // Tree) is offered separately, as a flat option without hierarchy.
  const leafTargetTerritoryId =
    annotatorPositionHierarchy.length > 0
      ? annotatorPositionHierarchy[annotatorPositionHierarchy.length - 1].id
      : undefined;

  // The selection sits inside at least one in-document Territory anchor. Ts are
  // created relative to those anchors, so the Sibling/Child buttons key off this
  // rather than the T opened in the Tree.
  const isSelectionInsideTAnchor = annotatorPositionHierarchy.length > 0;

  // the active T is rendered as its own flat option only when it is not already
  // part of the position hierarchy; otherwise the "opened in Tree" note rides on
  // the matching hierarchy node
  const activeTInHierarchy = useMemo(
    () => annotatorPositionHierarchy.some((node) => node.id === activeTerritoryId),
    [annotatorPositionHierarchy, activeTerritoryId],
  );

  // show the selector only when the position hierarchy adds a subT beyond the
  // active T
  const showTargetTerritorySelector = useMemo(
    () => annotatorPositionHierarchy.some((node) => node.id !== activeTerritoryId),
    [annotatorPositionHierarchy, activeTerritoryId],
  );

  const defaultTargetTerritoryId = leafTargetTerritoryId ?? activeTerritoryId;

  const [selectedTargetTerritoryId, setSelectedTargetTerritoryId] = useState<string | undefined>(
    defaultTargetTerritoryId,
  );

  // reset to the deepest leaf whenever the selection (and thus the candidate
  // subTs) changes
  useEffect(() => {
    setSelectedTargetTerritoryId(defaultTargetTerritoryId);
  }, [defaultTargetTerritoryId]);

  const selectedTargetTerritoryEntity =
    (selectedTargetTerritoryId ? entities[selectedTargetTerritoryId] : false) || territory;

  // A sibling-T is created under the target T's parent, so it only makes sense
  // when the target T (the anchor the cursor sits in, not the Tree T) has one. A
  // child-T is always creatable (its parent is the target itself).
  const selectedTargetHasParentT =
    selectedTargetTerritoryEntity?.class === EntityEnums.Class.Territory &&
    Boolean((selectedTargetTerritoryEntity as IResponseTerritory).data?.parent);

  // Shared target picker, driven from a caret in both the Statement and the
  // Territory subsection. Both edit the same selected target; each keeps its own
  // anchor and open state (dismissed on outside click / Esc).
  const targetPickerArgs = {
    hierarchy: annotatorPositionHierarchy,
    activeTerritoryId,
    activeTInHierarchy,
    entities,
    territory,
    value: selectedTargetTerritoryId,
    onChange: setSelectedTargetTerritoryId,
  };
  const statementTargetPicker = useAnnotatorTargetPicker({
    ...targetPickerArgs,
    title: "create S in T",
  });
  const territoryTargetPicker = useAnnotatorTargetPicker({
    ...targetPickerArgs,
    title: "create T relative to",
  });

  // Trailing cluster shown after the action button(s): an arrow into the target
  // T tag, plus a caret opening the shared picker. Used by both the Statement
  // and Territory subsections to read consistently as "create … → <target> ▾".
  const renderTargetTrailer = (
    picker: ReturnType<typeof useAnnotatorTargetPicker>,
    pickerTooltip: string,
  ) =>
    selectedTargetTerritoryEntity ? (
      <>
        <StyledStatementTargetArrow>
          <FaLongArrowAltRight size={16} />
        </StyledStatementTargetArrow>
        <StyledStatementTargetCurrent>
          <EntityTag
            fullWidth
            disableCopyToClipboard
            entity={selectedTargetTerritoryEntity}
            disableDoubleClick
            disableDrag
            button={
              <>
                {showTargetTerritorySelector && (
                  <StyledCaretButtonWrapper {...picker.referenceProps}>
                    <Button
                      icon={<FaCaretDown size={13} />}
                      color="primary"
                      tooltipLabel={pickerTooltip}
                      onClick={picker.toggle}
                      shape="sharp-square"
                    />
                  </StyledCaretButtonWrapper>
                )}
              </>
            }
          />
        </StyledStatementTargetCurrent>
      </>
    ) : null;

  const someAnchorsWithoutElvl = useMemo(
    () =>
      anchors.some(
        (anchor) =>
          anchor.attributes.elvl === undefined ||
          anchor.attributes.elvl === null ||
          anchor.attributes.elvl === "",
      ),
    [anchors],
  );

  const resolvedAnchors = useMemo((): AnnotatorAnchorListItem[] => {
    const out: AnnotatorAnchorListItem[] = [];
    for (const anchor of anchors) {
      const anchorTagName = anchor.getTagName();
      if (entities[anchorTagName]) {
        out.push({ anchor, anchorTagName });
      }
    }
    return out;
  }, [anchors, entities]);

  // Anchor controls mode: view (kebab menu + static elvl) or edit (inline
  // resize / elvl / unlink). Persisted so the choice survives menu reopen.
  const [anchorsEditMode, setAnchorsEditMode] = useState<boolean>(
    () => localStorage.getItem("annotatorAnchorsEditMode") === "true",
  );
  const handleAnchorsEditModeChange = (edit: boolean) => {
    setAnchorsEditMode(edit);
    localStorage.setItem("annotatorAnchorsEditMode", String(edit));
  };
  // Holding Ctrl/Cmd while hovering the anchor list enables edit mode
  // temporarily.
  const [anchorsHovered, setAnchorsHovered] = useState(false);
  const [modifierHeld, setModifierHeld] = useState(false);
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setModifierHeld(true);
    };
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") setModifierHeld(false);
    };
    // Release on window blur so the mode is not stuck after Cmd/Ctrl+Tab away.
    const handleBlur = () => setModifierHeld(false);
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  const anchorsEditActive = anchorsEditMode || (anchorsHovered && modifierHeld);
  // The switch only makes sense where the edit controls exist at all.
  const showAnchorsModeSwitch = !readonly && !disableCreate;

  const anchorGridRowData = useMemo(
    (): AnnotatorAnchorGridRowData => ({
      items: resolvedAnchors,
      entities,
      onRemoveAnchor,
      onUpdateAnchor,
      // The resize-anchor button follows the same gates as anchor creation:
      // hidden when creation is disabled (documents page) and for users without
      // edit rights (readonly = non owner/admin/editor-with-Resource-rights).
      onMoveAnchor:
        readonly || disableCreate || !onMoveAnchorBoundary ? undefined : handleMoveAnchorStart,
      readonly,
      // Disable (not hide) elvl controls where creation is disabled (documents
      // page): show the current elvl as a static icon, same as the readonly case.
      disableElvl: disableCreate,
      editControls: anchorsEditActive,
    }),
    [
      resolvedAnchors,
      entities,
      onRemoveAnchor,
      onUpdateAnchor,
      readonly,
      disableCreate,
      onMoveAnchorBoundary,
      handleMoveAnchorStart,
      anchorsEditActive,
    ],
  );

  return (
    <>
      {menuDragHandleProps && (
        <StyledAnnotatorMenuDragHandle {...menuDragHandleProps}>
          <MdDragIndicator size={18} />
        </StyledAnnotatorMenuDragHandle>
      )}

      {movingAnchor && movingEntity ? (
        // #2885 — move-anchor mode covers the whole menu body: just the moved
        // entity and the four boundary arrows.
        <StyledAnnotatorItem>
          <StyledAnnotatorItemTitle>
            <RiExpandWidthLine size={18} />
            Resize anchor span
          </StyledAnnotatorItemTitle>
          <StyledAnnotatorItemContent>
            <EntityTag entity={movingEntity} fullWidth disableDrag disableDoubleClick />
            <StyledMoveAnchorPanel>
              <StyledMoveAnchorControls>
                <StyledMoveAnchorGroup>
                  {onLocateAnchorBoundary && (
                    <Button
                      icon={<FaAnchor size={13} />}
                      noBackground
                      noBorder
                      tooltipLabel="scroll to the start of the span"
                      onClick={() => onLocateAnchorBoundary("open")}
                      inverted
                    />
                  )}
                  <StyledMoveAnchorGroupLabel>start</StyledMoveAnchorGroupLabel>
                  <ButtonGroup $smallGap>
                    <Button
                      icon={<FaChevronLeft size={13} />}
                      color="primary"
                      tooltipLabel="move start one character left"
                      onClick={() => handleMoveClick("open", -1)}
                    />
                    <Button
                      icon={<FaChevronRight size={13} />}
                      color="primary"
                      tooltipLabel="move start one character right"
                      onClick={() => handleMoveClick("open", 1)}
                    />
                  </ButtonGroup>
                </StyledMoveAnchorGroup>
                <StyledMoveAnchorGroup>
                  {onLocateAnchorBoundary && (
                    <Button
                      icon={<FaAnchor size={13} />}
                      noBackground
                      noBorder
                      tooltipLabel="scroll to the end of the span"
                      onClick={() => onLocateAnchorBoundary("close")}
                      inverted
                    />
                  )}
                  <StyledMoveAnchorGroupLabel>end</StyledMoveAnchorGroupLabel>
                  <ButtonGroup $smallGap>
                    <Button
                      icon={<FaChevronLeft size={13} />}
                      color="primary"
                      tooltipLabel="move end one character left"
                      onClick={() => handleMoveClick("close", -1)}
                    />
                    <Button
                      icon={<FaChevronRight size={13} />}
                      color="primary"
                      tooltipLabel="move end one character right"
                      onClick={() => handleMoveClick("close", 1)}
                    />
                  </ButtonGroup>
                </StyledMoveAnchorGroup>
              </StyledMoveAnchorControls>

              <StyledMoveAnchorFooter>
                <ButtonGroup>
                  <Button
                    icon={<IcoTrash />}
                    label="discard"
                    color="danger"
                    inverted
                    onClick={() => finishMove(false)}
                    tooltipLabel="Discard the moves (Esc)"
                  />
                  <Button
                    icon={<MdOutlineDone size={16} />}
                    label="done"
                    color="primary"
                    onClick={() => finishMove(true)}
                    tooltipLabel="Save the moved anchor span"
                  />
                </ButtonGroup>
              </StyledMoveAnchorFooter>
              <Loader show={isLoading} size={20} />
            </StyledMoveAnchorPanel>
          </StyledAnnotatorItemContent>
        </StyledAnnotatorItem>
      ) : (
        <>
          <StyledAnnotatorItem>
            <StyledAnnotatorItemTitle>
              <FaBolt size={13} />
              Actions
            </StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              <StyledAnnotatorItemContentLine>
                <Button
                  icon={<FaClipboard size={10} />}
                  size={ButtonSize.Small}
                  color="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(text);
                    toast.info("Text copied to clipboard");
                  }}
                  label={"clipboard"}
                  tooltipLabel="Copy selected text to clipboard"
                />
                {/* Done Button */}
                <StyledAnnotatorDoneButton>
                  <Button
                    color="primary"
                    inverted
                    icon={<PiCheckBold size={25} />}
                    size={ButtonSize.ExtraLarge}
                    shape="rounded-xl"
                    noBackground
                    onClick={() => onEscapePressed()}
                    tooltipLabel="Close selection menu"
                    tooltipContent={<p>(Esc, Ctrl+Enter or ⌘+Enter)</p>}
                    tooltipPosition="right"
                  />
                </StyledAnnotatorDoneButton>
              </StyledAnnotatorItemContentLine>
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
          {!disableCreate && (
            <StyledAnnotatorItem>
              <StyledAnnotatorItemTitle>
                <FaPlus size={13} />
                Create Anchors
              </StyledAnnotatorItemTitle>
              {/* Active Territory */}
              {activeTerritoryId && canCreateActiveTAnchor && onCreateActiveTAnchor && (
                <StyledAnnotatorItemContent>
                  <StyledAnnotatorItemContentLine>
                    <Button
                      label="Active Territory"
                      icon={<TbAnchor size={15} />}
                      color="primary"
                      onClick={() => {
                        onCreateActiveTAnchor(activeTerritoryElvl);
                      }}
                      tooltipLabel="Create anchor for active territory"
                    />
                    {activeTerritoryId && <EntityTagById fullWidth entityId={activeTerritoryId} />}
                    <ElvlButtonGroup
                      border
                      value={activeTerritoryElvl}
                      onChange={(territoryElvl) => {
                        setActiveTerritoryElvl(territoryElvl);
                      }}
                    />
                  </StyledAnnotatorItemContentLine>
                </StyledAnnotatorItemContent>
              )}
              {/* New Statement */}
              <StyledAnnotatorItemContent>
                {onCreateStatement && (
                  <StyledStatementSubsection>
                    <StyledAnnotatorItemContentLine>
                      <Button
                        label="New Statement"
                        tooltipLabel={`Create new Statement in ${
                          selectedTargetTerritoryEntity
                            ? selectedTargetTerritoryEntity.labels[0]
                            : "the active T"
                        }`}
                        icon={<TbAnchor size={15} />}
                        color="primary"
                        onClick={() => {
                          onCreateStatement(statementElvl, undefined, selectedTargetTerritoryId);
                        }}
                      />
                      {renderTargetTrailer(
                        statementTargetPicker,
                        "Choose target territory for the new Statement",
                      )}
                      <ElvlButtonGroup
                        border
                        value={statementElvl}
                        onChange={(statementElvl) => {
                          setStatementElvl(statementElvl);
                        }}
                      />
                    </StyledAnnotatorItemContentLine>

                    {annotatorPositionHierarchy.length === 0 && (
                      <StyledStatementTargetInfo>
                        selection is not within any subT — S will be created in the active T
                      </StyledStatementTargetInfo>
                    )}

                    {statementTargetPicker.popover}
                  </StyledStatementSubsection>
                )}
              </StyledAnnotatorItemContent>
              {/* Entity Suggester */}
              <StyledAnnotatorItemContent>
                <StyledAnnotatorItemContentLine
                  onMouseEnter={() => setSuggesterHovered(true)}
                  onMouseLeave={() => setSuggesterHovered(false)}
                >
                  <EntitySuggester
                    categoryTypes={classesAnnotator}
                    statementLabelHint
                    initTyped={text.length > 30 ? text.substring(0, 30) : text}
                    onSelected={(newAnchorId) => {
                      onAnchorAdd(newAnchorId, suggesterElvl);
                    }}
                    inputWidth="full"
                    openDetailOnCreate
                    parentTerritory={selectedTargetTerritoryEntity || territory}
                    onEntityCreateMutationSuccess={(entity) => {
                      dispatch(setSecondPanelExpanded(true));
                      if (entity.class === EntityEnums.Class.Statement) {
                        queryClient.invalidateQueries({
                          queryKey: ["territory", "statement-list"],
                        });
                        setStatementId(entity.id);
                      }
                      if (entity.class === EntityEnums.Class.Territory) {
                        queryClient.invalidateQueries({ queryKey: ["tree"] });
                        setTerritoryId(entity.id);
                      }
                    }}
                    onCreateStatement={(entityCreateModalProps) =>
                      onCreateStatement && onCreateStatement(suggesterElvl, entityCreateModalProps)
                    }
                    disableCleanTypedAfterCreate
                    onFocusChange={setSuggesterFocused}
                    anchorElvl={suggesterElvl}
                    onAnchorElvlChange={setSuggesterElvl}
                    rightContent={
                      <ElvlButtonGroup
                        value={suggesterElvl}
                        warning={suggesterFocused || suggesterHovered}
                        onChange={(suggesterElvl) => {
                          setSuggesterElvl(suggesterElvl);
                        }}
                      />
                    }
                  />
                </StyledAnnotatorItemContentLine>
              </StyledAnnotatorItemContent>
              {/* Territory Sibling or Child */}
              {isSelectionInsideTAnchor && (
                <StyledAnnotatorItemContent>
                  <StyledAnnotatorItemContentLine>
                    {onCreateTerritory && (
                      <StyledTerritorySubsection>
                        <StyledTerritorySubsectionTitle>territory</StyledTerritorySubsectionTitle>
                        <StyledTerritoryButtonColumn>
                          {selectedTargetHasParentT && (
                            <Button
                              icon={<TerritorySiblingIcon />}
                              color="greyer"
                              onClick={() => {
                                onCreateTerritory(
                                  "sibling-T",
                                  territoryElvl,
                                  selectedTargetTerritoryId,
                                );
                              }}
                              label="Sibling"
                              tooltipLabel="Create new sibling territory anchor"
                            />
                          )}
                          {/* Child is the suggested action: the cursor sits inside
                            the target T, so nesting a new subT under it is the
                            natural default; Sibling is the greyed alternative. */}
                          <Button
                            icon={<TerritoryChildIcon />}
                            color="primary"
                            onClick={() => {
                              onCreateTerritory(
                                "child-T",
                                territoryElvl,
                                selectedTargetTerritoryId,
                              );
                            }}
                            label="Child"
                            tooltipLabel="Create new child territory anchor"
                          />
                        </StyledTerritoryButtonColumn>
                        {renderTargetTrailer(
                          territoryTargetPicker,
                          "Choose the territory the new Territory is relative to",
                        )}
                        <ElvlButtonGroup
                          border
                          value={territoryElvl}
                          onChange={(territoryElvl) => {
                            setTerritoryElvl(territoryElvl);
                          }}
                        />
                        {territoryTargetPicker.popover}
                      </StyledTerritorySubsection>
                    )}
                  </StyledAnnotatorItemContentLine>
                </StyledAnnotatorItemContent>
              )}
            </StyledAnnotatorItem>
          )}
          <StyledAnnotatorItem
            onMouseEnter={() => setAnchorsHovered(true)}
            onMouseLeave={() => setAnchorsHovered(false)}
          >
            <StyledAnnotatorItemTitle>
              <PiSelectionFill size={13} />
              Anchors in selection
              <div style={{ marginLeft: "0.5rem" }}>
                {someAnchorsWithoutElvl && (
                  <IconWithTooltip
                    color="warning"
                    icon={<FaExclamationTriangle size={13} />}
                    tooltipLabel="Selection contains anchors which do not have epistemic level selected."
                  />
                )}
              </div>
              {showAnchorsModeSwitch && (
                <StyledAnchorModeSwitch>
                  <SwitchGroup>
                    <Button
                      icon={<FaRegEye size={11} />}
                      color="info"
                      label="view"
                      shape="rounded-sm"
                      noBorder
                      inverted={anchorsEditActive}
                      noBackground={anchorsEditActive}
                      tooltipLabel="view mode"
                      tooltipContent={<p>(hold ctrl/cmd over the list for temporary edit mode)</p>}
                      onClick={() => handleAnchorsEditModeChange(false)}
                    />
                    <Button
                      icon={<FaPen size={10} />}
                      color="info"
                      label="edit"
                      shape="rounded-sm"
                      noBorder
                      inverted={!anchorsEditActive}
                      noBackground={!anchorsEditActive}
                      tooltipLabel="edit mode — show anchor controls"
                      onClick={() => handleAnchorsEditModeChange(true)}
                    />
                  </SwitchGroup>
                </StyledAnchorModeSwitch>
              )}
            </StyledAnnotatorItemTitle>
            <StyledAnnotatorItemContent>
              <StyledAnnotatorAnchorListWrap>
                {anchors.length === 0 && (
                  <StyledAnnotatorNoAnchors>no anchors in selection</StyledAnnotatorNoAnchors>
                )}

                {resolvedAnchors.length > 0 && (
                  <List
                    rowProps={{ data: anchorGridRowData }}
                    rowCount={Math.ceil(resolvedAnchors.length / ANCHOR_GRID_COLUMNS)}
                    rowHeight={(index) => {
                      // First/last rows are taller by the margin; the row renders
                      // that extra as border-box padding, so the space scrolls
                      // with the content and doesn't shrink the viewport.
                      const lastRow = Math.ceil(resolvedAnchors.length / ANCHOR_GRID_COLUMNS) - 1;
                      const extra =
                        (index === 0 ? ANCHOR_GRID_ROW_MARGIN : 0) +
                        (index === lastRow ? ANCHOR_GRID_ROW_MARGIN : 0);
                      return ANCHOR_GRID_ROW_HEIGHT + extra;
                    }}
                    overscanCount={8}
                    style={{ maxHeight: "13rem", width: "100%" }}
                    rowComponent={(props) => <AnnotatorAnchorGridRow {...props} />}
                  />
                )}
              </StyledAnnotatorAnchorListWrap>
              <Loader show={isLoading} size={20} />
            </StyledAnnotatorItemContent>
          </StyledAnnotatorItem>
        </>
      )}
    </>
  );
};

export default TextAnnotatorMenu;
