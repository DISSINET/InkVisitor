import React, { useState } from "react";

import { IDocument, IEntity, IResponseTerritory } from "@shared/types";
import { Loader } from "components";
import { Button } from "components/basic/Button/Button";
import { BsSegmentedNav } from "react-icons/bs";
import { FaBolt, FaClipboard, FaPlus } from "react-icons/fa";
import { PiSelectionFill } from "react-icons/pi";
import { TbAnchor } from "react-icons/tb";
import { toast } from "react-toastify";
import { ButtonSize, classesAnnotator } from "types";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledAnnotatorAnchorList,
  StyledAnnotatorAnchorListWrap,
  StyledAnnotatorItem,
  StyledAnnotatorItemContent,
  StyledAnnotatorItemContentLine,
  StyledAnnotatorItemTitle,
  StyledAnnotatorNoAnchors,
  StyledTerritorySubsection,
  StyledTerritorySubsectionTitle,
} from "./AnnotatorStyles";
import { TerritoryCreateModalType } from "./types";
import { EntityEnums } from "@shared/enums";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "hooks";
import useKeypress from "hooks/useKeyPress";
import { ElvlButtonGroup } from "../IconButtonGroups/ElvlButtonGroup";

interface TextAnnotatorMenuProps {
  text: string;
  documentData: IDocument;
  anchors: string[];
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
  isLoadingEntities: boolean;
  hasParentT: boolean;
  isTextInsideThisT: boolean;
  activeTerritoryId: string | undefined;
  territory?: IResponseTerritory;
  onEscapePressed: () => void;
  disableCreate?: boolean;
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
  canCreateActiveTAnchor,
  isLoadingEntities,
  hasParentT,
  isTextInsideThisT,
  activeTerritoryId,
  territory,
  onEscapePressed,
  disableCreate,
}: TextAnnotatorMenuProps) => {
  const activeTerritory = entities[activeTerritoryId ?? ""];
  const queryClient = useQueryClient();
  const { setStatementId } = useSearchParams();
  useKeypress("Escape", onEscapePressed);

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

  return (
    <>
      <StyledAnnotatorItem>
        <StyledAnnotatorItemTitle>
          <FaBolt size={13} />
          Actions
        </StyledAnnotatorItemTitle>
        <StyledAnnotatorItemContent>
          <StyledAnnotatorItemContentLine>
            <Button
              icon={<BsSegmentedNav size={13} />}
              size={ButtonSize.Small}
              color="primary"
              onClick={() => {
                console.log("Segment selection into Statements");
              }}
              label={"Segment"}
              tooltipLabel="Segment selection into Statements"
              disabled
            />
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
          <StyledAnnotatorItemContent>
            {canCreateActiveTAnchor && onCreateActiveTAnchor && (
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
                {activeTerritory && (
                  <EntityTag entity={activeTerritory as IEntity} />
                )}
                <ElvlButtonGroup
                  border
                  value={activeTerritoryElvl}
                  onChange={(territoryElvl) => {
                    setActiveTerritoryElvl(territoryElvl);
                  }}
                />
              </StyledAnnotatorItemContentLine>
            )}
          </StyledAnnotatorItemContent>
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
          <Loader show={isLoadingEntities} size={13} />
        </StyledAnnotatorItemTitle>
        <StyledAnnotatorItemContent>
          <StyledAnnotatorAnchorListWrap>
            {anchors.length === 0 && (
              <StyledAnnotatorNoAnchors>
                no anchors in selection
              </StyledAnnotatorNoAnchors>
            )}
            <StyledAnnotatorAnchorList>
              {anchors.map((anchor) => {
                if (entities[anchor]) {
                  return (
                    <EntityTag
                      unlinkButton={{
                        onClick: () => {
                          if (onRemoveAnchor) {
                            onRemoveAnchor(anchor);
                          }
                        },
                      }}
                      key={anchor}
                      entity={entities[anchor] as IEntity}
                    />
                  );
                } else {
                  return <React.Fragment key={anchor} />;
                }
              })}
            </StyledAnnotatorAnchorList>
          </StyledAnnotatorAnchorListWrap>
        </StyledAnnotatorItemContent>
      </StyledAnnotatorItem>
    </>
  );
};

export default TextAnnotatorMenu;
