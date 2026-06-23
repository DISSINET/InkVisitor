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
import { FaBolt, FaClipboard, FaExclamationTriangle, FaPlus } from "react-icons/fa";
import { MdDragIndicator, MdOutlineDone } from "react-icons/md";
import { PiSelectionFill } from "react-icons/pi";
import { TbAnchor } from "react-icons/tb";
import { toast } from "react-toastify";
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
import {
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorDoneButton,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorMenuDragHandle,
  StyledAnnotatorNoAnchors,
  StyledStatementSubsection,
  StyledStatementTargetInfo,
  StyledStatementTargetList,
  StyledStatementTargetOption,
  StyledStatementTargetRadio,
  StyledStatementTargetSelector,
  StyledStatementTargetTitle,
  StyledTerritorySubsection,
  StyledTerritorySubsectionTitle,
} from "./AnnotatorStyles";
import { TerritoryCreateModalType } from "./types";

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
   * Leaf subTs (Territory anchors) the current selection sits inside, deepest
   * first. Lets the user target the proper subT for the new Statement instead
   * of always using the active subT.
   */
  annotatorPositionSubTIds: string[];
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
  annotatorPositionSubTIds,
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

  // target subT for the new Statement. Options = the active subT plus the leaf
  // subTs the selection sits inside (per the Annotator position). The selector
  // only matters when those differ; default is the deepest leaf subT.
  const statementTargetOptions = useMemo(() => {
    const ids: string[] = [];
    annotatorPositionSubTIds.forEach((id) => {
      if (id && !ids.includes(id)) ids.push(id);
    });
    if (activeTerritoryId && !ids.includes(activeTerritoryId)) {
      ids.push(activeTerritoryId);
    }
    return ids;
  }, [annotatorPositionSubTIds, activeTerritoryId]);

  // show the selector only when the position-based leaf subTs add something
  // beyond the active subT
  const showStatementTargetSelector = useMemo(
    () => annotatorPositionSubTIds.some((id) => id && id !== activeTerritoryId),
    [annotatorPositionSubTIds, activeTerritoryId],
  );

  const defaultStatementTargetId = annotatorPositionSubTIds[0] ?? activeTerritoryId;

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
                radiusRight
                radiusLeft
                shape="square"
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
                {showStatementTargetSelector && (
                  <StyledStatementTargetSelector>
                    <StyledStatementTargetTitle>create S in T</StyledStatementTargetTitle>
                    <StyledStatementTargetList>
                      {statementTargetOptions.map((optionId) => {
                        const optionEntity =
                          entities[optionId] ||
                          (optionId === activeTerritoryId ? territory : undefined);
                        if (!optionEntity) {
                          return null;
                        }
                        const isSelected = optionId === selectedStatementTargetId;
                        return (
                          <StyledStatementTargetOption
                            key={optionId}
                            $isSelected={isSelected}
                            onClick={() => setSelectedStatementTargetId(optionId)}
                          >
                            <StyledStatementTargetRadio $isSelected={isSelected} />
                            <EntityTag
                              fullWidth
                              disableCopyToClipboard
                              entity={optionEntity}
                              disableDoubleClick
                              disableDrag
                            />
                          </StyledStatementTargetOption>
                        );
                      })}
                    </StyledStatementTargetList>
                  </StyledStatementTargetSelector>
                )}

                {annotatorPositionSubTIds.length === 0 && (
                  <StyledStatementTargetInfo>
                    selection is not within any subT — S will be created in the active T
                  </StyledStatementTargetInfo>
                )}
                <StyledAnnotatorItemContentLine>
                  <Button
                    label="New Statement"
                    tooltipLabel="Create new Statement from selection"
                    icon={<TbAnchor size={15} />}
                    color="primary"
                    onClick={() => {
                      onCreateStatement(statementElvl, undefined, selectedStatementTargetId);
                    }}
                  />
                  <ElvlButtonGroup
                    border
                    value={statementElvl}
                    onChange={(statementElvl) => {
                      setStatementElvl(statementElvl);
                    }}
                  />
                </StyledAnnotatorItemContentLine>
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
