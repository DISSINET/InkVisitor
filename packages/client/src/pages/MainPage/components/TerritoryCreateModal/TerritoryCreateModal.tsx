import React, { SetStateAction, Dispatch, useState, useEffect } from "react";

import { ResponseMetaI, TerritoryI, ActantI } from "@shared/types";

import {
  Button,
  Modal,
  ModalHeader,
  ModalCard,
  ModalContent,
  ModalFooter,
  Input,
} from "components";

import { createActant } from "api/createActant";

import { v4 as uuidv4 } from "uuid";

interface TerritoryCreateModal {
  meta: ResponseMetaI;
  fetchTerritory: (id: string) => void;
  parentTerritory: TerritoryI;
  setCreateTerritoryModalOpen: Dispatch<SetStateAction<boolean>>;
  createTerritoryModalOpen: boolean;
}

export const TerritoryCreateModal: React.FC<TerritoryCreateModal> = ({
  meta,
  fetchTerritory,
  parentTerritory,
  setCreateTerritoryModalOpen,
  createTerritoryModalOpen,
}) => {
  const [territoryToCreate, setTerritoryToCreate] = useState({
    label: "",
    content: "",
    language: "",
    parent: "",
    type: "",
  });

  // when new parent territory comes in
  useEffect(() => {
    const newTerritory = { ...territoryToCreate };

    newTerritory.content = parentTerritory.data.content;
    newTerritory.type = parentTerritory.data.type;
    newTerritory.language = parentTerritory.data.language;
    newTerritory.parent = parentTerritory.id;

    setTerritoryToCreate(newTerritory);
  }, [parentTerritory]);

  const changeDataValue = (
    dataProp: "label" | "content" | "type" | "language",
    dataValue: string
  ) => {
    const newTerritory = { ...territoryToCreate };
    if (dataProp in newTerritory) {
      newTerritory[dataProp] = dataValue;
      setTerritoryToCreate(newTerritory);
    }
  };

  // send data to server
  const createTerritory = async () => {
    console.log(territoryToCreate);

    const newActant: ActantI = {
      id: uuidv4(),
      class: "T",
      data: territoryToCreate,
      meta: {},
    };

    const createResponse = await createActant(newActant);

    if (createResponse && createResponse.id ? createResponse.id : false) {
      fetchTerritory(parentTerritory.id);
      return true;
    } else {
      return false;
    }
  };

  return (
    <Modal
      showModal={createTerritoryModalOpen}
      onClose={() => {
        setCreateTerritoryModalOpen(false);
      }}
    >
      <ModalCard>
        <ModalHeader
          onClose={() => {
            setCreateTerritoryModalOpen(false);
          }}
          title="create new territory"
        ></ModalHeader>
        <ModalContent>
          <div>
            <Input
              type="text"
              label="label"
              onChangeFn={(newValue: string) => {
                changeDataValue("label", newValue);
              }}
              value={territoryToCreate.label}
            />
            <Input
              type="select"
              label="language"
              onChangeFn={(newValue: string) => {
                changeDataValue("language", newValue);
              }}
              options={meta.dictionaries.languages}
              value={territoryToCreate.language}
            />
            <Input
              type="select"
              label="type"
              onChangeFn={(newValue: string) => {
                changeDataValue("type", newValue);
              }}
              options={meta.dictionaries.territorytypes}
              value={territoryToCreate.type}
            />
            <Input
              type="text"
              label="content"
              onChangeFn={(newValue: string) => {
                changeDataValue("content", newValue);
              }}
              value={territoryToCreate.content}
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <div className="ml-2">
            <Button
              color="danger"
              onClick={() => {
                setCreateTerritoryModalOpen(false);
              }}
              label="cancel"
            />
          </div>
          <div className="ml-2">
            <Button
              color="primary"
              onClick={async () => {
                const created = await createTerritory();
                if (created) {
                  setCreateTerritoryModalOpen(false);
                }
              }}
              label="create"
            />
          </div>
        </ModalFooter>
      </ModalCard>
    </Modal>
  );
};
