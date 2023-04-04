import { EntityEnums } from "@shared/enums";
import { IResponseTerritory } from "@shared/types";
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
import { useQuery } from "react-query";
import { EntitySuggester, EntityTag } from "..";

interface AddTerritoryModal {
  onClose: () => void;
  onSubmit: (territory: IResponseTerritory) => void;
}
export const AddTerritoryModal: React.FC<AddTerritoryModal> = ({
  onClose,
  onSubmit,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [territoryId, setTerritoryId] = useState("");

  useEffect(() => {
    setShowModal(true);
  }, []);

  const {
    status,
    data: territory,
    error,
    isFetching,
  } = useQuery(
    ["territory", territoryId],
    async () => {
      if (territoryId) {
        const res = await api.territoryGet(territoryId);
        return res.data;
      }
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );

  return (
    <>
      <Modal
        showModal={showModal}
        width="thin"
        onEnterPress={() => territory && onSubmit(territory)}
        onClose={onClose}
      >
        <ModalHeader title="Select parent territory" />
        <ModalContent>
          {territory ? (
            <EntityTag
              entity={territory}
              tooltipPosition="left"
              unlinkButton={{
                onClick: () => {
                  setTerritoryId("");
                },
                color: "danger",
              }}
            />
          ) : (
            <EntitySuggester
              disableTemplatesAccept
              filterEditorRights
              inputWidth={96}
              disableCreate
              categoryTypes={[EntityEnums.Class.Territory]}
              onSelected={(newSelectedId: string) => {
                setTerritoryId(newSelectedId);
              }}
            />
          )}
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="greyer"
              inverted
              onClick={() => {
                setTerritoryId("");
                onClose();
              }}
            />
            <Button
              key="submit"
              label="Create"
              color="info"
              onClick={() => territory && onSubmit(territory)}
              disabled={!territory}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
