import { UserRole } from "@shared/enums";
import { ITerritory } from "@shared/types";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { CTerritoryActant } from "constructors";
import { useSearchParams } from "hooks";
import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { toast } from "react-toastify";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";

interface ContextMenuNewTerritoryModal {
  territoryActantId: string;
  onClose: () => void;
}
export const ContextMenuNewTerritoryModal: React.FC<
  ContextMenuNewTerritoryModal
> = ({ onClose, territoryActantId }) => {
  const [territoryName, setTerritoryName] = useState("");
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    setShowModal(true);
  }, []);

  const queryClient = useQueryClient();

  const { setTerritoryId } = useSearchParams();
  const dispatch = useAppDispatch();

  const createTerritoryMutation = useMutation(
    async (newTerritory: ITerritory) => await api.entityCreate(newTerritory),
    {
      onSuccess: (data, variables) => {
        onClose();
        toast.info(`Territory [${variables.label}] created!`);
        queryClient.invalidateQueries("tree");

        dispatch(setTreeInitialized(false));
        setTerritoryId(variables.id);
      },
      onError: () => {
        toast.error(`Error: Territory [${territoryName}] not created!`);
      },
    }
  );

  const handleCreateTerritory = () => {
    if (territoryName.length > 0) {
      const newTerritory: ITerritory = CTerritoryActant(
        territoryName,
        territoryActantId,
        -1,
        localStorage.getItem("userrole") as UserRole
      );
      createTerritoryMutation.mutate(newTerritory);
    } else {
      toast.warning("Fill territory name!");
    }
  };

  return (
    <>
      <Modal
        onEnterPress={handleCreateTerritory}
        onClose={() => onClose()}
        showModal={showModal}
        disableBgClick
      >
        <ModalHeader title={"Add Territory"} />
        <ModalContent>
          <Input
            autoFocus
            label={"Territory name: "}
            value={territoryName}
            onChangeFn={(value: string) => setTerritoryName(value)}
            changeOnType
          />
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              label="Cancel"
              color="success"
              onClick={() => {
                onClose();
              }}
            />
            <Button
              label="Save"
              color="primary"
              onClick={() => handleCreateTerritory()}
            />
          </ButtonGroup>
        </ModalFooter>
        <Loader show={createTerritoryMutation.isLoading} />
      </Modal>
    </>
  );
};
