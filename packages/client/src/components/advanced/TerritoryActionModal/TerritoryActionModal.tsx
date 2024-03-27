import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IResponseGeneric,
  IResponseTerritory,
  ITerritory,
} from "@shared/types";
import { UseMutationResult, useQuery } from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { TbHomeMove } from "react-icons/tb";
import { getShortLabelByLetterCount } from "utils/utils";
import { EntitySuggester } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledArrowContainer,
  StyledArrowHead,
  StyledArrowShaft,
  StyledArrowWrapper,
  StyledBlueText,
  StyledFlexRow,
  StyledGreyText,
  StyledHeadingColumn,
  StyledInto,
  StyledNotes,
  StyledParentRow,
  StyledTagList,
  StyledTagWrap,
} from "./TerritoryActionModalStyles";

interface TerritoryActionModal {
  territory: IResponseTerritory;
  onClose: () => void;
  showModal?: boolean;
  selectedParentEntity: IEntity | false;
  setMoveToParentEntity: React.Dispatch<React.SetStateAction<IEntity | false>>;
  excludedMoveTerritories: string[];

  updateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    {
      territoryId: string;
      changes: Partial<ITerritory>;
    },
    unknown
  >;
  duplicateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    {
      territoryId: string;
      targets: string[];
      withChildren: boolean;
    },
    unknown
  >;
}
export const TerritoryActionModal: React.FC<TerritoryActionModal> = ({
  showModal = false,
  onClose,
  territory,
  selectedParentEntity,
  setMoveToParentEntity,
  excludedMoveTerritories,

  updateTerritoryMutation,
  duplicateTerritoryMutation,
}) => {
  const [action, setAction] = useState<"move" | "duplicate">("move");
  const [includeChildren, setIncludeChildren] = useState(true);
  const [newParentEntities, setNewParentEntities] = useState<IEntity[]>([]);

  useEffect(() => {
    if (selectedParentEntity) {
      setNewParentEntities([selectedParentEntity]);
      setMoveToParentEntity(false);
    }
  }, []);

  const oldParentId =
    territory?.data.parent && territory?.data.parent.territoryId;

  const {
    data: oldParentTerritory,
    error: oldParentError,
    isFetching: oldParentIsFetching,
  } = useQuery({
    queryKey: ["territory", oldParentId],
    queryFn: async () => {
      if (oldParentId) {
        const res = await api.territoryGet(oldParentId);
        return res.data;
      }
    },
    enabled: !!oldParentId && api.isLoggedIn(),
  });

  const showDuplicateNote =
    action === "duplicate" && territory && territory.statements.length > 0;

  const showMoveNote = action === "move" && newParentEntities.length > 1;

  useEffect(() => {
    if (newParentEntities.length > 1 && action === "move") {
      setAction("duplicate");
    }
  }, [newParentEntities]);

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader title="Manage territory" icon={<TbHomeMove />} />
      <ModalContent column enableScroll>
        <StyledFlexRow>
          {territory && (
            <>
              <span>
                <AttributeButtonGroup
                  disabled={newParentEntities.length > 1}
                  fullSizeDisabled
                  disabledBtnsTooltip="cannot move to multiple Territories"
                  options={[
                    {
                      longValue: "Move",
                      shortValue: "Move",
                      onClick: () => {
                        setAction("move");
                        setIncludeChildren(true);
                      },
                      selected: action === "move",
                    },
                    {
                      longValue: "Duplicate",
                      shortValue: "Duplicate",
                      onClick: () => {
                        setAction("duplicate");
                      },
                      selected: action === "duplicate",
                    },
                  ]}
                />
              </span>
              <EntityTag entity={territory} fullWidth />
            </>
          )}
        </StyledFlexRow>

        <StyledParentRow>
          <div>
            <StyledBlueText>from old parent T</StyledBlueText>
            {oldParentTerritory && <EntityTag entity={oldParentTerritory} />}
          </div>

          <StyledArrowWrapper>
            <StyledInto>into</StyledInto>
            <StyledArrowContainer>
              <StyledArrowShaft />
              <StyledArrowHead />
            </StyledArrowContainer>
          </StyledArrowWrapper>

          <div>
            <StyledGreyText>{`new parent(s) T (${newParentEntities.length} T selected)`}</StyledGreyText>

            <StyledTagList>
              {newParentEntities.map((e, key) => {
                return (
                  <StyledTagWrap key={key}>
                    <EntityTag
                      entity={e}
                      unlinkButton={{
                        onClick: () =>
                          setNewParentEntities(
                            newParentEntities.filter((et) => et.id !== e.id)
                          ),
                      }}
                    />
                  </StyledTagWrap>
                );
              })}
            </StyledTagList>

            {oldParentId && (
              <EntitySuggester
                autoFocus
                placeholder="new parent"
                categoryTypes={[EntityEnums.Class.Territory]}
                excludedActantIds={[
                  oldParentId,
                  ...excludedMoveTerritories,
                  ...newParentEntities.map((entity) => entity.id),
                ]}
                onPicked={(entity) => {
                  setNewParentEntities([...newParentEntities, entity]);
                }}
                disableTemplatesAccept
                filterEditorRights
                disableCreate
              />
            )}
          </div>
        </StyledParentRow>

        <StyledFlexRow>
          <StyledHeadingColumn>
            <span>
              <AttributeButtonGroup
                disabled={action === "move"}
                fullSizeDisabled
                options={[
                  {
                    longValue: "Move children",
                    shortValue: "Move children",
                    onClick: () => {
                      setIncludeChildren(true);
                    },
                    selected: includeChildren === true,
                  },
                  {
                    longValue: "Don't move children",
                    shortValue: "Don't move children",
                    onClick: () => {
                      setIncludeChildren(false);
                    },
                    selected: includeChildren === false,
                  },
                ]}
              />
            </span>
          </StyledHeadingColumn>
        </StyledFlexRow>
      </ModalContent>
      <ModalFooter column>
        <div style={{ width: "100%", display: "flex" }}>
          <ButtonGroup>
            <Button label="cancel" onClick={onClose} />
            <Button
              disabled={!newParentEntities.length}
              label={action}
              onClick={() => {
                if (newParentEntities.length > 0) {
                  if (action === "move") {
                    // MOVE
                    updateTerritoryMutation.mutate({
                      territoryId: territory.id,
                      changes: {
                        data: {
                          parent: {
                            territoryId: newParentEntities[0].id,
                            order: EntityEnums.Order.First,
                          },
                        },
                      },
                    });
                    onClose();
                  } else if (action === "duplicate") {
                    // DUPLICATE
                    duplicateTerritoryMutation.mutate({
                      territoryId: territory.id,
                      targets: newParentEntities.map((e) => e.id),
                      withChildren: includeChildren,
                    });
                    onClose();
                  }
                }
              }}
              color={"success"}
            />
          </ButtonGroup>
        </div>
        {(showDuplicateNote || showMoveNote) && (
          <StyledNotes>
            {/* this note will appear if we are duplicating T (with or without children) that have at least 1 S */}
            {showDuplicateNote && (
              <p>
                <i>{`Note: Statements are not going to be duplicated`}</i>
              </p>
            )}
          </StyledNotes>
        )}
      </ModalFooter>
    </Modal>
  );
};
