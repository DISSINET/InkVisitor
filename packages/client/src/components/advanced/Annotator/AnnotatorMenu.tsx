import React, { useCallback, useEffect, useMemo, useState } from "react";
import { List } from "react-window";

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
  FaLongArrowAltRight,
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
import { TerritoryChildIcon, TerritorySiblingIcon } from "./AnnotatorIcons";
import {
  ANCHOR_GRID_COLUMNS,
  ANCHOR_GRID_ROW_HEIGHT,
  AnnotatorAnchorGridRow,
  AnnotatorAnchorGridRowData,
  AnnotatorAnchorListItem,
} from "./AnnotatorMenuAnchorListRow";
import {
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorDoneButton,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenuDragHandle,
  StyledAnnotatorNoAnchors,
  StyledCaretButtonWrapper,
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
  const leafTargetTerritoryId =
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
            <StyledAnnotatorItemContentLine>
              <EntitySuggester
                categoryTypes={classesAnnotator}
                initTyped={text.length > 30 ? text.substring(0, 30) : text}
                onSelected={(newAnchorId) => {
                  onAnchorAdd(newAnchorId, suggesterElvl);
                }}
                inputWidth={200}
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
                    <StyledTerritoryButtonColumn>
                      <Button
                        icon={<TerritorySiblingIcon />}
                        color={isTextInsideThisT ? "greyer" : "primary"}
                        onClick={() => {
                          onCreateTerritory("sibling-T", territoryElvl, selectedTargetTerritoryId);
                        }}
                        label="Sibling"
                        tooltipLabel="Create new sibling territory anchor"
                      />
                      {hasParentT && (
                        <Button
                          icon={<TerritoryChildIcon />}
                          color={isTextInsideThisT ? "primary" : "greyer"}
                          onClick={() => {
                            onCreateTerritory("child-T", territoryElvl, selectedTargetTerritoryId);
                          }}
                          label="Child"
                          tooltipLabel="Create new child territory anchor"
                        />
                      )}
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
