import React, { useEffect, useRef, useState } from "react";
import { FaTrashAlt, FaStar, FaPlus } from "react-icons/fa";
import { toast } from "react-toastify";
import { useQueryClient } from "react-query";
import { useLocation, useHistory } from "react-router";
const queryString = require("query-string");

import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Submit,
} from "components";
import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./ContextMenuStyles";
import { IActant, ITerritory } from "@shared/types";
import { CTerritoryActant } from "constructors";

interface ContextMenu {
  territoryActant: IActant;
}
export const ContextMenu: React.FC<ContextMenu> = ({ territoryActant }) => {
  const queryClient = useQueryClient();
  const ref = useRef<HTMLDivElement>(null);

  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);

  const [showMenu, setShowMenu] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [territoryName, setTerritoryName] = useState("");
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
  });

  const createTerritory = async (label: string) => {
    const newTerritory: ITerritory = CTerritoryActant(
      label,
      territoryActant.id,
      -1
    );
    const res = await api.actantsCreate(newTerritory);
    if (res.status === 200) {
      setShowCreate(false);
      toast.info(`Territory [${newTerritory.label}] created!`);
      setTerritoryName("");
      queryClient.invalidateQueries("tree");

      hashParams["territory"] = newTerritory.id;
      history.push({
        hash: queryString.stringify(hashParams),
      });
    } else {
      toast.error(`Error: Territory [${label}] not created!`);
    }
  };

  const onSubmitDelete = async () => {
    const res = await api.actantsDelete(territoryActant.id);
    if (res.status === 200) {
      toast.info(`Territory [${territoryActant.label}] deleted!`);
      queryClient.invalidateQueries("tree");
    } else {
      toast.error(`Error: Territory [${territoryActant.label}] not deleted!`);
    }
    setShowSubmit(false);
  };

  const setDivPosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCurrentPosition({
        x: rect["x"],
        y: rect["y"],
        height: rect["height"],
      });
    }
  };

  return (
    <>
      <StyledWrapper
        ref={ref}
        onMouseEnter={() => {
          if (!showMenu) {
            setDivPosition();
          }
          setShowMenu(true);
        }}
        onMouseLeave={() => setShowMenu(false)}
      >
        <StyledFaChevronCircleDown size={14} />

        {showMenu && (
          <StyledContextButtonGroup
            showMenu={showMenu}
            clientX={currentPosition.x}
            clientY={currentPosition.y}
            height={currentPosition.height}
          >
            <Button
              key="add"
              icon={<FaPlus size={14} />}
              color="info"
              onClick={() => {
                // add child
                setShowCreate(true);
              }}
            />
            <Button
              key="favorites"
              icon={<FaStar size={14} />}
              color="warning"
              onClick={() => {
                // add to favorites
                toast.success(
                  `You're adding territory [${territoryActant.label}] to favorites. (not implemented yet)`
                );
              }}
            />
            <Button
              key="delete"
              icon={<FaTrashAlt size={14} />}
              color="danger"
              onClick={() => {
                setShowSubmit(true);
              }}
            />
          </StyledContextButtonGroup>
        )}
      </StyledWrapper>

      <Submit
        title={"Delete Territory"}
        text={`Do you really want do delete Territory with ID [${territoryActant.id}]?`}
        show={showSubmit}
        onSubmit={() => onSubmitDelete()}
        onCancel={() => setShowSubmit(false)}
      />
      <Modal
        onClose={() => setShowCreate(false)}
        showModal={showCreate}
        disableBgClick
        onSubmit={() => {
          if (territoryName.length > 0) {
            createTerritory(territoryName);
          } else {
            toast.warning("Fill territory name!");
          }
        }}
      >
        <ModalHeader title={"Add child Territory"} />
        <ModalContent>
          <Input
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
                setShowCreate(false);
                setTerritoryName("");
              }}
            />
            <Button
              label="Save"
              color="primary"
              onClick={() => {
                if (territoryName.length > 0) {
                  createTerritory(territoryName);
                } else {
                  toast.warning("Fill territory name!");
                }
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    </>
  );
};
