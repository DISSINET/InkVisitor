import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
} from "components";
import React, { useEffect, useState } from "react";
import { AttributeButtonGroup } from "../AttributeButtonGroup/AttributeButtonGroup";
import { EntityTag } from "../EntityTag/EntityTag";
import { IEntity } from "@shared/types";
import { StyledGrid, StyledHeadingColumn } from "./TerritoryActionModalStyles";
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

  const {
    data: newParentTerritory,
    error: newParentError,
    isFetching: newParentIsFetching,
  } = useQuery({
    queryKey: ["territory", newParentId],
    queryFn: async () => {
      if (newParentId) {
        const res = await api.territoryGet(newParentId);
        return res.data;
      }
    },
    enabled: !!newParentId && api.isLoggedIn(),
  });

  return (
    <Modal showModal={showModal} onClose={onClose}>
      <ModalContent column>
        <StyledGrid>
          {territory && (
            <>
              <StyledHeadingColumn>moving territory</StyledHeadingColumn>{" "}
              <EntityTag entity={territory} />
            </>
          )}
          <StyledHeadingColumn>action</StyledHeadingColumn>
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
          <StyledHeadingColumn>include children T</StyledHeadingColumn>
          <AttributeButtonGroup
            options={[
              {
                longValue: "Yes",
                shortValue: "Yes",
                onClick: () => {
                  setIncludeChildren(true);
                },
                selected: includeChildren === true,
              },
              {
                longValue: "No",
                shortValue: "No",
                onClick: () => {
                  setIncludeChildren(false);
                },
                selected: includeChildren === false,
              },
            ]}
          />
        </StyledGrid>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: "1rem",
          }}
        >
          <div>
            <p>Old parent T</p>
            {oldParentTerritory && <EntityTag entity={oldParentTerritory} />}
          </div>

          <div>
            <p>New parent T</p>
            {newParentTerritory ? (
              <EntityTag entity={newParentTerritory} />
            ) : (
              <EntitySuggester
                categoryTypes={[EntityEnums.Class.Territory]}
                onSelected={(id) => setNewParentId(id)}
              />
            )}
          </div>
        </div>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="cancel" onClick={onClose} />
          <Button
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
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
