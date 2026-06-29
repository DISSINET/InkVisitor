import React, { useCallback, useEffect, useMemo, useState } from "react";
import { List } from "react-window";

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { Tag } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseTerritory } from "@inkvisitor/shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { IconWithTooltip, Loader } from "components";
import { Button } from "components/basic/Button/Button";
import { useSearchParams } from "hooks";
import useKeypress from "hooks/useKeyPress";
import {
  FaBolt,
  FaCaretDown,
  FaClipboard,
  FaExclamationTriangle,
  FaPlus,
} from "react-icons/fa";
import { MdDragIndicator, MdOutlineDone } from "react-icons/md";
import { PiSelectionFill } from "react-icons/pi";
import { TbAnchor } from "react-icons/tb";
import { toast } from "react-toastify";
import { setSecondPanelExpanded } from "redux/features/layout/mainPage/secondPanelExpandedSlice";
import { useAppDispatch } from "redux/hooks";
import { ButtonSize, classesAnnotator } from "types";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import {
  ANCHOR_GRID_COLUMNS,
  ANCHOR_GRID_ROW_HEIGHT,
  AnnotatorAnchorGridRow,
  AnnotatorAnchorGridRowData,
  AnnotatorAnchorListItem,
} from "./AnnotatorMenuAnchorListRow";
import { AnnotatorStatementTargetPicker } from "./AnnotatorStatementTargetPicker";
import {
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorDoneButton,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenuDragHandle,
  StyledAnnotatorNoAnchors,
  StyledStatementCaretAnchor,
  StyledStatementCreateSplit,
  StyledStatementSubsection,
  StyledStatementTargetCurrent,
  StyledStatementTargetInfo,
  StyledStatementTargetPopover,
  StyledTerritorySubsection,
  StyledTerritorySubsectionTitle,
} from "./AnnotatorStyles";
import { AnnotatorPositionTNode, TerritoryCreateModalType } from "./types";

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
  ) => void;
  onRemoveAnchor?: (anchor: Tag) => void;
  canCreateActiveTAnchor: boolean;
  onCreateActiveTAnchor?: (elvl: EntityEnums.Elvl) => void;
  hasParentT: boolean;
  isTextInsideThisT: boolean;
  activeTerritoryId: string | undefined;
  territory?: IResponseTerritory;
  onEscapePressed: () => void;
  disableCreate?: boolean;
  onUpdateAnchor?: (anchor: Tag, elvl: EntityEnums.Elvl) => void;

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
  canCreateActiveTAnchor,
  hasParentT,
  isTextInsideThisT,
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
  const { setStatementId } = useSearchParams();

  const tryCloseMenu = useCallback(() => {
    const isModalOpen = document.querySelector('[data-attribute-modal="true"]') !== null;
    if (!isModalOpen) {
      onEscapePressed();
    }
  }, [onEscapePressed]);

  useKeypress("Escape", tryCloseMenu);
  useKeypress("Enter", tryCloseMenu, undefined, true);

  const [activeTerritoryElvl, setActiveTerritoryElvl] = useState<EntityEnums.Elvl>(
    EntityEnums.Elvl.Textual,
  );
  const [statementElvl, setStatementElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);
  const [suggesterElvl, setSuggesterElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);
  const [territoryElvl, setTerritoryElvl] = useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);

  // The deepest leaf subT at the cursor (smallest span = innermost) is the
  // "relevant" T and the default Statement target. The active T (opened in the
  // Tree) is offered separately, as a flat option without hierarchy.
  const leafStatementTargetId =
    annotatorPositionHierarchy.length > 0
      ? annotatorPositionHierarchy[annotatorPositionHierarchy.length - 1].id
      : undefined;

  // the active T is rendered as its own flat option only when it is not already
  // part of the position hierarchy; otherwise the "opened in Tree" note rides on
  // the matching hierarchy node
  const activeTInHierarchy = useMemo(
    () => annotatorPositionHierarchy.some((node) => node.id === activeTerritoryId),
    [annotatorPositionHierarchy, activeTerritoryId],
  );

  // show the selector only when the position hierarchy adds a subT beyond the
  // active T
  const showStatementTargetSelector = useMemo(
    () => annotatorPositionHierarchy.some((node) => node.id !== activeTerritoryId),
    [annotatorPositionHierarchy, activeTerritoryId],
  );

  const defaultStatementTargetId = leafStatementTargetId ?? activeTerritoryId;

  const [selectedStatementTargetId, setSelectedStatementTargetId] = useState<string | undefined>(
    defaultStatementTargetId,
  );

  // reset to the deepest leaf whenever the selection (and thus the candidate
  // subTs) changes
  useEffect(() => {
    setSelectedStatementTargetId(defaultStatementTargetId);
  }, [defaultStatementTargetId]);

  const selectedStatementTargetEntity =
    (selectedStatementTargetId ? entities[selectedStatementTargetId] : false) || territory;

  // Target picker popover, opened from the split button's caret. Anchored to the
  // caret wrapper; dismissed on outside click / Esc.
  const [isTargetPickerOpen, setIsTargetPickerOpen] = useState(false);
  const {
    refs: targetPickerRefs,
    floatingStyles: targetPickerFloatingStyles,
    context: targetPickerContext,
  } = useFloating({
    open: isTargetPickerOpen,
    onOpenChange: setIsTargetPickerOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 4 })],
  });
  const targetPickerDismiss = useDismiss(targetPickerContext);
  const { getReferenceProps, getFloatingProps } = useInteractions([targetPickerDismiss]);

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

  const anchorGridRowData = useMemo(
    (): AnnotatorAnchorGridRowData => ({
      items: resolvedAnchors,
      entities,
      onRemoveAnchor,
      onUpdateAnchor,
      readonly,
    }),
    [resolvedAnchors, entities, onRemoveAnchor, onUpdateAnchor, readonly],
  );

  return (
    <>
      {menuDragHandleProps && (
        <StyledAnnotatorMenuDragHandle {...menuDragHandleProps}>
          <MdDragIndicator size={18} />
          <span>Drag to move</span>
        </StyledAnnotatorMenuDragHandle>
      )}

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
                icon={<MdOutlineDone size={25} />}
                size={ButtonSize.ExtraLarge}
                shape="rounded-md"
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
                {activeTerritory && <EntityTag entity={activeTerritory} />}
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
                  <StyledStatementCreateSplit>
                    <Button
                      label="New Statement"
                      tooltipLabel={`Create new Statement in ${
                        selectedStatementTargetEntity
                          ? selectedStatementTargetEntity.labels[0]
                          : "the active T"
                      }`}
                      icon={<TbAnchor size={15} />}
                      color="primary"
                      radiusLeft={showStatementTargetSelector}
                      onClick={() => {
                        onCreateStatement(statementElvl, undefined, selectedStatementTargetId);
                      }}
                    />
                    {showStatementTargetSelector && (
                      <StyledStatementCaretAnchor
                        ref={targetPickerRefs.setReference}
                        {...getReferenceProps()}
                      >
                        <Button
                          icon={<FaCaretDown size={13} />}
                          color="primary"
                          radiusRight
                          fullHeight
                          tooltipLabel="Choose target territory for the new Statement"
                          onClick={() => setIsTargetPickerOpen((open) => !open)}
                        />
                      </StyledStatementCaretAnchor>
                    )}
                  </StyledStatementCreateSplit>

                  {selectedStatementTargetEntity && (
                    <StyledStatementTargetCurrent>
                      <EntityTag
                        disableCopyToClipboard
                        entity={selectedStatementTargetEntity}
                        disableDoubleClick
                        disableDrag
                      />
                    </StyledStatementTargetCurrent>
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

                {isTargetPickerOpen && (
                  <FloatingPortal>
                    <StyledStatementTargetPopover
                      ref={targetPickerRefs.setFloating}
                      style={targetPickerFloatingStyles}
                      {...getFloatingProps()}
                    >
                      <AnnotatorStatementTargetPicker
                        hierarchy={annotatorPositionHierarchy}
                        activeTerritoryId={activeTerritoryId}
                        activeTInHierarchy={activeTInHierarchy}
                        entities={entities}
                        territory={territory}
                        value={selectedStatementTargetId}
                        onChange={(id) => {
                          setSelectedStatementTargetId(id);
                          setIsTargetPickerOpen(false);
                        }}
                      />
                    </StyledStatementTargetPopover>
                  </FloatingPortal>
                )}
              </StyledStatementSubsection>
            )}
          </StyledAnnotatorItemContent>
          {/* Entity Suggester */}
          <StyledAnnotatorItemContent>
            <StyledAnnotatorItemContentLine>
              <EntitySuggester
                categoryTypes={classesAnnotator}
                initTyped={text.length > 30 ? text.substring(0, 30) : text}
                onSelected={(newAnchorId) => {
                  onAnchorAdd(newAnchorId, suggesterElvl);
                }}
                inputWidth={200}
                openDetailOnCreate
                parentTerritory={selectedStatementTargetEntity || territory}
                onEntityCreateMutationSuccess={(entity) => {
                  dispatch(setSecondPanelExpanded(true));
                  if (entity.class === EntityEnums.Class.Statement) {
                    queryClient.invalidateQueries({
                      queryKey: ["territory", "statement-list"],
                    });
                    setStatementId(entity.id);
                  }
                }}
                onCreateStatement={(entityCreateModalProps) =>
                  onCreateStatement && onCreateStatement(suggesterElvl, entityCreateModalProps)
                }
                disableCleanTypedAfterCreate
              />
              <ElvlButtonGroup
                border
                value={suggesterElvl}
                onChange={(suggesterElvl) => {
                  setSuggesterElvl(suggesterElvl);
                }}
              />
            </StyledAnnotatorItemContentLine>
          </StyledAnnotatorItemContent>
          {/* Territory Sibling or Child */}
          {activeTerritoryId && (
            <StyledAnnotatorItemContent>
              <StyledAnnotatorItemContentLine>
                {onCreateTerritory && (
                  <StyledTerritorySubsection>
                    <StyledTerritorySubsectionTitle>territory</StyledTerritorySubsectionTitle>
                    <Button
                      icon={
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill="currentColor"
                            d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v1.5A1.75 1.75 0 0 1 12.25 7H5v2.5A1.5 1.5 0 0 0 6.5 11H8v-.25C8 9.784 8.784 9 9.75 9h2.5c.966 0 1.75.784 1.75 1.75v1.5A1.75 1.75 0 0 1 12.25 14h-2.5A1.75 1.75 0 0 1 8 12.25V12H6.5A2.5 2.5 0 0 1 4 9.5V7h-.25A1.75 1.75 0 0 1 2 5.25zm7 8.5c0 .414.336.75.75.75h2.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-2.5a.75.75 0 0 0-.75.75zM12.25 6a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75h-8.5a.75.75 0 0 0-.75.75v1.5c0 .414.336.75.75.75z"
                          />
                        </svg>
                      }
                      color={isTextInsideThisT ? "greyer" : "primary"}
                      onClick={() => {
                        onCreateTerritory("sibling-T", territoryElvl);
                      }}
                      label="Sibling"
                      tooltipLabel="Create new sibling territory anchor"
                    />
                    {hasParentT && (
                      <Button
                        icon={
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 32 32"
                          >
                            <path
                              fill="currentColor"
                              d="M28 12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11v4H9a2 2 0 0 0-2 2v4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9v-4h14v4h-3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-3v-4a2 2 0 0 0-2-2h-6v-4ZM12 28H4v-4h8Zm16 0h-8v-4h8ZM4 4h24v6H4Z"
                            />
                          </svg>
                        }
                        color={isTextInsideThisT ? "primary" : "greyer"}
                        onClick={() => {
                          onCreateTerritory("child-T", territoryElvl);
                        }}
                        label="Child"
                        tooltipLabel="Create new child territory anchor"
                      />
                    )}
                    <ElvlButtonGroup
                      border
                      value={territoryElvl}
                      onChange={(territoryElvl) => {
                        setTerritoryElvl(territoryElvl);
                      }}
                    />
                  </StyledTerritorySubsection>
                )}
              </StyledAnnotatorItemContentLine>
            </StyledAnnotatorItemContent>
          )}
        </StyledAnnotatorItem>
      )}
      <StyledAnnotatorItem>
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
                rowHeight={ANCHOR_GRID_ROW_HEIGHT}
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
  );
};

export default TextAnnotatorMenu;
