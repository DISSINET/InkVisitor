import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IResponseGeneric,
  IResponseTerritory,
  ITerritory,
} from "@shared/types";
import {
  UseMutationResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import api from "api";
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
  StyledNotes,
  StyledParentRow,
  StyledTagList,
} from "./TerritoryActionModalStyles";
import { AxiosResponse } from "axios";

interface TerritoryActionModal {
  territory: IResponseTerritory;
  onClose: () => void;
  showModal?: boolean;
  selectedParentEntity: IEntity | false;
  setMoveToParentEntity: React.Dispatch<React.SetStateAction<IEntity | false>>;

  updateTerritoryMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>, any>,
    Error,
    {
      territoryId: string;
      changes: Partial<ITerritory>;
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

  updateTerritoryMutation,
}) => {
  const [action, setaction] = useState<"move" | "duplicate">("move");
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

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader title="Manage territory" icon={<TbHomeMove />} />
      <ModalContent column>
        <StyledFlexRow>
          {territory && (
            <>
              <span>
                <AttributeButtonGroup
                  options={[
                    {
                      longValue: "Move",
                      shortValue: "Move",
                      onClick: () => {
                        setaction("move");
                        setIncludeChildren(true);
                      },
                      selected: action === "move",
                    },
                    {
                      longValue: "Duplicate",
                      shortValue: "Duplicate",
                      onClick: () => {
                        setaction("duplicate");
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
            <StyledBlueText>Old parent T</StyledBlueText>
            {oldParentTerritory && <EntityTag entity={oldParentTerritory} />}
          </div>

          <StyledArrowWrapper>
            <i>into</i>
            <StyledArrowContainer>
              <StyledArrowShaft />
              <StyledArrowHead />
            </StyledArrowContainer>
          </StyledArrowWrapper>

          <div>
            <StyledGreyText>{`New parent(s) T (${newParentEntities.length} T selected)`}</StyledGreyText>
            {newParentEntities.length ? (
              <StyledTagList>
                {newParentEntities.map((e, key) => {
                  return (
                    <div key={key} style={{ marginBottom: "0.2rem" }}>
                      <EntityTag
                        entity={e}
                        unlinkButton={{
                          onClick: () =>
                            setNewParentEntities(
                              newParentEntities.filter((et) => et.id !== e.id)
                            ),
                        }}
                      />
                    </div>
                  );
                })}
              </StyledTagList>
            ) : (
              <i>{"select T.."}</i>
            )}
          </div>
        </StyledParentRow>

        <StyledFlexRow>
          <StyledHeadingColumn>
            <span>
              <AttributeButtonGroup
                disabled={action === "move"}
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
          <EntitySuggester
            placeholder="new parent"
            categoryTypes={[EntityEnums.Class.Territory]}
            excludedActantIds={
              oldParentId
                ? [
                    oldParentId,
                    territory.id,
                    ...newParentEntities.map((entity) => entity.id),
                  ]
                : [
                    territory.id,
                    ...newParentEntities.map((entity) => entity.id),
                  ]
            }
            onPicked={(entity) => {
              setNewParentEntities([...newParentEntities, entity]);
            }}
          />
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

            {/* this note will appear if we are moving T and more than one T is selected
              <T label> is the label of the first T in the list */}
            {showMoveNote && (
              <p>
                <i>{`Note: Statements will be moved only to the first selected T (<T ${newParentEntities[0].label}>)`}</i>
              </p>
            )}
          </StyledNotes>
        )}
      </ModalFooter>
    </Modal>
  );
};
