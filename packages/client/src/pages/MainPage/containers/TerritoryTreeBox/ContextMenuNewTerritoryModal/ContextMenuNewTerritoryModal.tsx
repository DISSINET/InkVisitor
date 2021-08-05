import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "react-query";
const queryString = require("query-string");

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
import { ITerritory } from "@shared/types";
import { CTerritoryActant } from "constructors";
import useKeypress from "hooks/useKeyPress";
import { useHistory, useLocation } from "react-router-dom";
import api from "api";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";

interface ContextMenuNewTerritoryModal {
  territoryActantId: string;
  onClose: () => void;
}
export const ContextMenuNewTerritoryModal: React.FC<ContextMenuNewTerritoryModal> =
  ({ onClose, territoryActantId }) => {
    const [territoryName, setTerritoryName] = useState("");
    const [showModal, setShowModal] = useState(false);
    useEffect(() => {
      setShowModal(true);
    }, []);

    const queryClient = useQueryClient();
    let history = useHistory();
    let location = useLocation();
    var hashParams = queryString.parse(location.hash);
    const dispatch = useAppDispatch();

    const createTerritoryMutation = useMutation(
      async (newTerritory: ITerritory) => await api.actantsCreate(newTerritory),
      {
        onSuccess: (data, variables) => {
          onClose();
          toast.info(`Territory [${variables.label}] created!`);
          queryClient.invalidateQueries("tree");

          dispatch(setTreeInitialized(false));
          hashParams["territory"] = variables.id;
          history.push({
            hash: queryString.stringify(hashParams),
          });
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
          -1
        );
        createTerritoryMutation.mutate(newTerritory);
      } else {
        toast.warning("Fill territory name!");
      }
    };

    useKeypress("Enter", handleCreateTerritory, [territoryName]);
    useKeypress("Escape", onClose);

    return (
      <>
        <Modal onClose={() => onClose()} showModal={showModal} disableBgClick>
          <ModalHeader title={"Add child Territory"} />
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
