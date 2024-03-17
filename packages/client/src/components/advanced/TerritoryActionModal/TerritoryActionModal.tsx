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
  StyledFlexRow,
  StyledGrid,
  StyledHeadingColumn,
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

  // const {
  //   data: newParentTerritory,
  //   error: newParentError,
  //   isFetching: newParentIsFetching,
  // } = useQuery({
  //   queryKey: ["territory", newParentId],
  //   queryFn: async () => {
  //     if (newParentId) {
  //       const res = await api.territoryGet(newParentId);
  //       return res.data;
  //     }
  //   },
  //   enabled: !!newParentId && api.isLoggedIn(),
  // });

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalHeader title="Manage territory" />
      <ModalContent column>
        <StyledGrid>
          {territory && (
            <>
              <StyledHeadingColumn>
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
              </StyledHeadingColumn>
              <EntityTag entity={territory} />
            </>
          )}
        </StyledGrid>

        <StyledFlexRow>
          <div>
            <p>Old parent T</p>
            {oldParentTerritory && <EntityTag entity={oldParentTerritory} />}
          </div>

          <div>
            <p>{`New parent(s) T (${newParentEntity.length} T selected)`}</p>
            {newParentEntity.length ? (
              <>
                {newParentEntity.map((e) => {
                  return (
                    <EntityTag
                      entity={e}
                      unlinkButton={{
                        onClick: () =>
                          setNewParentEntity(
                            newParentEntity.filter((et) => et.id !== e.id)
                          ),
                      }}
                    />
                  );
                })}
              </>
            ) : (
              <i>{"select T.."}</i>
            )}
          </div>
        </StyledFlexRow>

        <StyledGrid>
          <StyledHeadingColumn>
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
      <ModalFooter>
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
      </ModalFooter>
    </Modal>
  );
};
