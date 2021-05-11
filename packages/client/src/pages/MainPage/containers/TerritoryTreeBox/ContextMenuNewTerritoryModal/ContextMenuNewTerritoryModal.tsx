import React, { useState } from "react";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
const queryString = require("query-string");

import {
  Button,
  ButtonGroup,
  Input,
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
import { setTreeInitialized } from "redux/features/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";

interface ContextMenuNewTerritoryModal {
  territoryActantId: string;
  onClose: () => void;
}
export const ContextMenuNewTerritoryModal: React.FC<ContextMenuNewTerritoryModal> = ({
  onClose,
  territoryActantId,
}) => {
  const [territoryName, setTerritoryName] = useState("");
  const queryClient = useQueryClient();
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);
  const dispatch = useAppDispatch();

  const handleCreateTerritory = () => {
    if (territoryName.length > 0) {
      createTerritory();
    } else {
      toast.warning("Fill territory name!");
    }
  };

  const createTerritory = async () => {
    const newTerritory: ITerritory = CTerritoryActant(
      territoryName,
      territoryActantId,
      -1
    );
    const res = await api.actantsCreate(newTerritory);
    if (res.status === 200) {
      onClose();
      toast.info(`Territory [${newTerritory.label}] created!`);
      queryClient.invalidateQueries("tree");

      dispatch(setTreeInitialized(false));
      hashParams["territory"] = newTerritory.id;
      history.push({
        hash: queryString.stringify(hashParams),
      });
    } else {
      toast.error(`Error: Territory [${territoryName}] not created!`);
    }
  };

  useKeypress("Enter", handleCreateTerritory, [territoryName]);
  useKeypress("Escape", onClose);

  return (
    <Modal onClose={() => onClose()} showModal={true} disableBgClick>
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
    </Modal>
  );
};
