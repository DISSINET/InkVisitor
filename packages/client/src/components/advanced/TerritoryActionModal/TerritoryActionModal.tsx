import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import React, { useEffect, useState } from "react";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { EntityTag } from "../EntityTag/EntityTag";
import { IEntity } from "@shared/types";
import {
  StyledBlueText,
  StyledParentRow,
  StyledGreyText,
  StyledGrid,
  StyledHeadingColumn,
  StyledFlexRow,
  StyledArrowContainer,
  StyledArrowShaft,
  StyledArrowHead,
  StyledArrowWrapper,
  StyledTagList,
  StyledNotes,
} from "./TerritoryActionModalStyles";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { EntitySuggester } from "..";
import { EntityEnums } from "@shared/enums";

interface TerritoryActionModal {
  territory?: IEntity;
  onClose: () => void;
  showModal?: boolean;
  onMoveT: (newParentT: string) => void;
  onDuplicateT: (newParentT: string) => void;
  selectedParentId?: string;
}
export const TerritoryActionModal: React.FC<TerritoryActionModal> = ({
  showModal = false,
  onClose,
  territory,
  onMoveT,
  onDuplicateT,
  selectedParentId,
}) => {
  const [action, setaction] = useState<"move" | "duplicate">("move");
  const [includeChildren, setIncludeChildren] = useState(true);

  const [newParentId, setNewParentId] = useState<false | string>(false);
  const [newParentEntity, setNewParentEntity] = useState<IEntity[]>([]);

  useEffect(() => {
    if (selectedParentId) {
      setNewParentId(selectedParentId);
    }
  }, []);

  const { territoryId: oldParentTerritoryId } = territory?.data.parent;

  const {
    data: oldParentTerritory,
    error: oldParentError,
    isFetching: oldParentIsFetching,
  } = useQuery({
    queryKey: ["territory", oldParentTerritoryId],
    queryFn: async () => {
      if (oldParentTerritoryId) {
        const res = await api.territoryGet(oldParentTerritoryId);
        return res.data;
      }
    },
    enabled: !!oldParentTerritoryId && api.isLoggedIn(),
  });

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader title="Manage territory" />
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
            <StyledGreyText>{`New parent(s) T (${newParentEntity.length} T selected)`}</StyledGreyText>
            {newParentEntity.length ? (
              <StyledTagList>
                {newParentEntity.map((e) => {
                  return (
                    <div style={{ marginBottom: "0.2rem" }}>
                      <EntityTag
                        entity={e}
                        unlinkButton={{
                          onClick: () =>
                            setNewParentEntity(
                              newParentEntity.filter((et) => et.id !== e.id)
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

        <StyledGrid>
          <StyledHeadingColumn>
            <span>
              <AttributeButtonGroup
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
            excludedActantIds={newParentEntity.map((entity) => entity.id)}
            // onSelected={(id) => setNewParentId(id)}
            onPicked={(entity) => {
              setNewParentEntity([...newParentEntity, entity]);
            }}
          />
        </StyledGrid>
      </ModalContent>
      <ModalFooter column>
        <ButtonGroup>
          <Button label="cancel" onClick={onClose} />
          {/* <Button
            disabled={!newParentTerritory}
            label={action}
            onClick={() => {
              if (newParentTerritory) {
                if (action === "move" && newParentId) {
                  onMoveT(newParentId);
                  onClose();
                } else if (action === "duplicate" && newParentId) {
                  onDuplicateT(newParentId);
                  onClose();
                }
              }
            }}
            color="success"
          /> */}
        </ButtonGroup>
        <StyledNotes>
          {/* this note will appear if we are duplicating T (with or without children) that have at least 1 S */}
          <p>
            <i>{`Note:  Statements are not going to be duplicated`}</i>
          </p>

          {/* this note will appear if we are moving T and more than one T is selected
              <T label> is the label of the first T in the list */}
          <p>
            <i>{`Note:  Statements will be moved only to the first selected T (<T label>)`}</i>
          </p>
        </StyledNotes>
      </ModalFooter>
    </Modal>
  );
};
