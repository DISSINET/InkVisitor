import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IResponseEntity,
  IResponseGeneric,
  IResponseTerritory,
  ITerritory,
} from "@inkvisitor/shared/types";
import { UseMutationResult, useQuery } from "@tanstack/react-query";
import api from "api";
import { AxiosResponse } from "axios";
import {
  Button,
  ButtonGroup,
  CancelButton,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { TbHomeMove } from "react-icons/tb";
import { EntitySuggester } from "..";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledArrowContainer,
  StyledArrowHead,
  StyledArrowShaft,
  StyledArrowWrapper,
  StyledBlueText,
  StyledFlexContainer,
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
  territory: IResponseTerritory | IResponseEntity;
  oldParentTerritory: IResponseTerritory | IResponseEntity;
  showModal?: boolean;
  onClose: () => void;
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
  // duplicateTerritoryMutation: UseMutationResult<
  //   AxiosResponse<IResponseGeneric<any>, any>,
  //   Error,
  //   {
  //     territoryId: string;
  //     targets: string[];
  //     withChildren: boolean;
  //   },
  //   unknown
  // >;
  isFetchingTerritory?: boolean;
}
export const TerritoryActionModal: React.FC<TerritoryActionModal> = ({
  territory,
  oldParentTerritory,
  showModal = false,
  onClose,
  selectedParentEntity,
  setMoveToParentEntity,
  excludedMoveTerritories,

  updateTerritoryMutation,
  // duplicateTerritoryMutation,
  isFetchingTerritory,
}) => {
  const [action, setAction] = useState<"move" | "duplicate">("move");
  const [includeChildren, setIncludeChildren] = useState(true);
  const [newParentEntities, setNewParentEntities] = useState<IEntity[]>([]);
  const [order, setOrder] = useState<EntityEnums.Order>(EntityEnums.Order.Last);

  useEffect(() => {
    if (selectedParentEntity) {
      setNewParentEntities([selectedParentEntity]);
      setMoveToParentEntity(false);
    }
  }, []);

  // const showDuplicateNote =
  //   action === "duplicate" && territory && territory.statements.length > 0;

  // const showMoveNote = action === "move" && newParentEntities.length > 1;

  useEffect(() => {
    if (newParentEntities.length > 1 && action === "move") {
      setAction("duplicate");
    }
  }, [newParentEntities]);

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader title="Manage territory" icon={<TbHomeMove />} />
      <ModalContent column enableScroll isLoading={isFetchingTerritory}>
        <StyledFlexContainer>
          <StyledFlexRow>
            {territory && (
              <>
                <span>
                  <AttributeButtonGroup
                    // #2684 disabled until we have batch remove
                    disabled
                    // disabled={newParentEntities.length > 1}
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
              <StyledGreyText>{`new parent T`}</StyledGreyText>

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

              {/* #2684 only allow one parent until we have batch remove */}
              {oldParentTerritory && newParentEntities.length === 0 && (
                <EntitySuggester
                  autoFocus
                  placeholder="new parent"
                  categoryTypes={[EntityEnums.Class.Territory]}
                  excludedActantIds={[
                    oldParentTerritory.id,
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
          <StyledFlexRow>
            <StyledGreyText>Order:</StyledGreyText>
            <AttributeButtonGroup
              options={[
                {
                  longValue: "First",
                  shortValue: "First",
                  onClick: () => {
                    setOrder(EntityEnums.Order.First);
                  },
                  selected: order === EntityEnums.Order.First,
                },
                {
                  longValue: "Last",
                  shortValue: "Last",
                  onClick: () => {
                    setOrder(EntityEnums.Order.Last);
                  },
                  selected: order === EntityEnums.Order.Last,
                },
              ]}
            />
          </StyledFlexRow>
        </StyledFlexContainer>
      </ModalContent>
      <ModalFooter column>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <ButtonGroup>
            <CancelButton onClick={onClose} />
            <Button
              disabled={!newParentEntities.length || !territory}
              label={action}
              onClick={() => {
                if (newParentEntities.length > 0 && territory) {
                  if (action === "move") {
                    // MOVE
                    updateTerritoryMutation.mutate({
                      territoryId: territory.id,
                      changes: {
                        data: {
                          parent: {
                            territoryId: newParentEntities[0].id,
                            order: order,
                          },
                        },
                      },
                    });
                    onClose();
                  }
                  //  else if (action === "duplicate") {
                  //   // DUPLICATE
                  //   duplicateTerritoryMutation.mutate({
                  //     territoryId: territory.id,
                  //     targets: newParentEntities.map((e) => e.id),
                  //     withChildren: includeChildren,
                  //   });
                  //   onClose();
                  // }
                }
              }}
              color={"success"}
            />
          </ButtonGroup>
        </div>
        {/* this note will appear if we are duplicating T (with or without children) that have at least 1 S */}
        {/* {(showDuplicateNote || showMoveNote) && (
          <StyledNotes>
            {showDuplicateNote && (
              <p>
                <i>{`Note: Statements are not going to be duplicated`}</i>
              </p>
            )}
          </StyledNotes>
        )} */}
      </ModalFooter>
    </Modal>
  );
};
