import React, { useCallback, useMemo, useState } from "react";

import { Tag } from "@inkvisitor/annotator/src/lib";
import { EntityEnums } from "@shared/enums";
import { IDocument, IEntity, IResponseTerritory } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { IconWithTooltip, Loader } from "components";
import { Button } from "components/basic/Button/Button";
import { useSearchParams } from "hooks";
import useKeypress from "hooks/useKeyPress";
import {
  FaBolt,
  FaClipboard,
  FaExclamationTriangle,
  FaPlus,
} from "react-icons/fa";
import { MdDone, MdOutlineDone } from "react-icons/md";
import { PiSelectionFill } from "react-icons/pi";
import { TbAnchor } from "react-icons/tb";
import { toast } from "react-toastify";
import { ButtonSize, classesAnnotator } from "types";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";
import {
  StyledAnnotatorAnchorList,
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorDoneButton,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorNoAnchors,
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
    }
  ) => void;
  onCreateTerritory?: (
    territoryCreateModalType: TerritoryCreateModalType,
    elvl: EntityEnums.Elvl
  ) => void;
  onRemoveAnchor?: (anchor: string) => void;
  canCreateActiveTAnchor: boolean;
  onCreateActiveTAnchor?: (elvl: EntityEnums.Elvl) => void;
  hasParentT: boolean;
  isTextInsideThisT: boolean;
  activeTerritoryId: string | undefined;
  territory?: IResponseTerritory;
  onEscapePressed: () => void;
  disableCreate?: boolean;
  onUpdateAnchor?: (anchor: Tag, elvl: EntityEnums.Elvl) => void;

  isLoading: boolean;
}

export const TextAnnotatorMenu = ({
  text,
  anchors,
  entities,
  onAnchorAdd,
  onCreateStatement = undefined,
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

  isLoading = false,
}: TextAnnotatorMenuProps) => {
  const activeTerritory = entities[activeTerritoryId ?? ""];
  const queryClient = useQueryClient();
  const { setStatementId } = useSearchParams();

  const tryCloseMenu = useCallback(() => {
    const isModalOpen =
      document.querySelector('[data-attribute-modal="true"]') !== null;
    if (!isModalOpen) {
      onEscapePressed();
    }
  }, [onEscapePressed]);

  useKeypress("Escape", tryCloseMenu);
  useKeypress("Enter", tryCloseMenu, undefined, true);

  const [activeTerritoryElvl, setActiveTerritoryElvl] =
    useState<EntityEnums.Elvl>(EntityEnums.Elvl.Textual);
  const [statementElvl, setStatementElvl] = useState<EntityEnums.Elvl>(
    EntityEnums.Elvl.Textual
  );
  const [suggesterElvl, setSuggesterElvl] = useState<EntityEnums.Elvl>(
    EntityEnums.Elvl.Textual
  );
  const [territoryElvl, setTerritoryElvl] = useState<EntityEnums.Elvl>(
    EntityEnums.Elvl.Textual
  );

  const someAnchorsWithoutElvl = useMemo(
    () =>
      anchors.some(
        (anchor) =>
          anchor.attributes.elvl === undefined ||
          anchor.attributes.elvl === null ||
          anchor.attributes.elvl === ""
      ),
    [anchors]
  );

  return (
    <>
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
          tooltipContent={[<p>(Esc, Ctrl+Enter or ⌘+Enter)</p>]}
          tooltipPosition="left"
        />
      </StyledAnnotatorDoneButton>
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
          {canCreateActiveTAnchor && onCreateActiveTAnchor && (
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
              <StyledAnnotatorItemContentLine>
                <Button
                  icon={<TbAnchor size={15} />}
                  color="primary"
                  onClick={() => {
                    onCreateStatement(statementElvl);
                  }}
                  label="New Statement"
                  tooltipLabel="Create new Statement from selection"
                />
                <ElvlButtonGroup
                  border
                  value={statementElvl}
                  onChange={(statementElvl) => {
                    setStatementElvl(statementElvl);
                  }}
                />
              </StyledAnnotatorItemContentLine>
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
                parentTerritory={territory}
                onEntityCreateMutationSuccess={(entity) => {
                  if (entity.class === EntityEnums.Class.Statement) {
                    queryClient.invalidateQueries({
                      queryKey: ["territory", "statement-list"],
                    });
                    setStatementId(entity.id);
                  }
                }}
                onCreateStatement={(entityCreateModalProps) =>
                  onCreateStatement &&
                  onCreateStatement(suggesterElvl, entityCreateModalProps)
                }
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
          <StyledAnnotatorItemContent>
            <StyledAnnotatorItemContentLine>
              {onCreateTerritory && (
                <StyledTerritorySubsection>
                  <StyledTerritorySubsectionTitle>
                    territory
                  </StyledTerritorySubsectionTitle>
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
              <StyledAnnotatorNoAnchors>
                no anchors in selection
              </StyledAnnotatorNoAnchors>
            )}
            <StyledAnnotatorAnchorList>
              {anchors.map((anchor, key) => {
                const anchorTagName = anchor.getTagName();
                if (entities[anchorTagName]) {
                  return (
                    <EntityTag
                      key={key}
                      unlinkButton={{
                        onClick: () => {
                          if (onRemoveAnchor) {
                            onRemoveAnchor(anchorTagName);
                          }
                        },
                      }}
                      entity={entities[anchorTagName]}
                      elvlButtonGroup={
                        <ElvlButtonGroup
                          value={anchor.attributes.elvl as EntityEnums.Elvl}
                          onChange={(elvl) => {
                            onUpdateAnchor?.(anchor, elvl);
                          }}
                        />
                      }
                    />
                  );
                } else {
                  return <React.Fragment key={key} />;
                }
              })}
            </StyledAnnotatorAnchorList>
          </StyledAnnotatorAnchorListWrap>
          <Loader show={isLoading} size={20} />
        </StyledAnnotatorItemContent>
      </StyledAnnotatorItem>
    </>
  );
};

export default TextAnnotatorMenu;
