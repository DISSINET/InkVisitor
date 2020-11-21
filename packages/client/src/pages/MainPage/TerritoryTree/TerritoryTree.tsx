import React, { SetStateAction, Dispatch, useState } from "react";

import {
  Tag,
  Button,
  Modal,
  ModalHeader,
  ModalCard,
  ModalContent,
  ModalFooter,
  Input,
} from "components";

import { FaPlus } from "react-icons/fa";
import { Entities } from "types";
import { ResponseTerritoryI } from "@shared/types";
import { TerritoryI } from "@shared/types";
import { useHistory } from "react-router-dom";

interface TerritoryTree {
  territory?: ResponseTerritoryI;
  fetchTerritory: (id: string) => void;
  setActiveStatementId: (id: string) => void;
  territoryCreateFn: Function;
}

export const TerritoryTree: React.FC<TerritoryTree> = ({
  territory,
  fetchTerritory,
  setActiveStatementId,
  territoryCreateFn,
}) => {
  const history = useHistory();
  const territoryParent = territory && (territory.data.parent as string);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [labelNew, setLabelNew] = useState("");

  const createNew = async () => {
    return territoryCreateFn(labelNew);
  };

  /**
   * Modal window for assigning new territory
   */
  const renderModal = () => {
    return (
      <Modal
        showModal={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
        }}
      >
        <ModalCard>
          <ModalHeader
            onClose={() => {
              setCreateModalOpen(false);
            }}
            title="create new territory"
          ></ModalHeader>
          <ModalContent>
            <div>
              <Input
                type="text"
                label="label"
                onChangeFn={(newValue: string) => {
                  setLabelNew(newValue);
                }}
                value={labelNew}
              />
            </div>
          </ModalContent>
          <ModalFooter>
            <div className="ml-2">
              <Button
                color="danger"
                onClick={() => {
                  setCreateModalOpen(false);
                }}
                label="cancel"
              />
            </div>
            <div className="ml-2">
              <Button
                color="primary"
                onClick={async () => {
                  const created = await createNew();
                  if (created) {
                    setLabelNew("");
                    setCreateModalOpen(false);
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

  return (
    <div>
      {renderModal()}
      <div className="flex flex-col mt-1">
        <div className="mb-1">
          <h3>{"Selected territory: "}</h3>
          <Tag
            propId={territory?.id}
            category={Entities.T.id}
            color={Entities.T.color}
            label={territory?.data.label}
            invertedLabel
          />
        </div>
        {territoryParent && (
          <div className="">
            <h3>{"Parent territory: "}</h3>
            <Tag
              propId={territoryParent}
              category={Entities.T.id}
              color={Entities.T.color}
              label={territoryParent && territoryParent}
              button={
                territoryParent &&
                territoryParent.length > 0 && (
                  <Button
                    color="primary"
                    onClick={() => {
                      fetchTerritory(territoryParent);
                      history.push(`/${territoryParent}`);
                      setActiveStatementId("");
                    }}
                    label="<"
                  />
                )
              }
            />
          </div>
        )}
      </div>
      <div className="flex flex-col mt-1">
        <Button
          onClick={() => {
            setCreateModalOpen(true);
          }}
          icon={<FaPlus size={12} style={{ marginRight: "2px" }} />}
          label="new child territory"
        />
      </div>
      <div className="flex flex-col mt-1">
        {territory && territory.children && territory.children.length > 0 && (
          <h3>{"Children territories: "}</h3>
        )}
        {territory &&
          territory.children.map((child: TerritoryI, key) => {
            return (
              <div className="flex mb-1" key={key}>
                <Tag
                  propId={child.id}
                  category={Entities.T.id}
                  color={Entities.T.color}
                  label={child && child.data.label}
                  button={
                    <>
                      <Button
                        onClick={() => {
                          fetchTerritory(child.id);
                          history.push(`/${child.id}`);
                          setActiveStatementId("");
                        }}
                        label=">"
                      />
                    </>
                  }
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
