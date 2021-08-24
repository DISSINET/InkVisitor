import {
  StyledAttributeWrapper,
  StyledAttributeModalContent,
} from "./StatementEditorAttributesStyles";

import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Input,
  Submit,
} from "components";

import { MdSettings } from "react-icons/md";
import {
  ActantType,
  Certainty,
  Elvl,
  Position,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
} from "@shared/enums";
import { IOperator } from "@shared/types";
import React, { useState } from "react";
import { ElvlToggle } from "../..";

interface AttributeData {
  certainty?: Certainty;
  elvl?: Elvl;
  logic?: Logic;
  mood?: Mood[];
  moodvariant?: MoodVariant;
  virtuality?: Virtuality;
  partitivity?: Partitivity;
  operator?: IOperator;
}

interface StatementEditorAttributes {
  mode: "action" | "actant" | "prop" | "prop-value" | "prop-type";
  modalTitle: string;
  data: AttributeData;
  handleUpdate: (data: AttributeData) => void;
}

export const StatementEditorAttributes: React.FC<StatementEditorAttributes> = ({
  mode,
  modalTitle,
  data,
  handleUpdate,
}) => {
  const [modalData, setModalData] = useState<AttributeData>(data);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleAcceptClick = () => {
    handleUpdate(modalData);
  };

  const handleOpenModalClick = () => {
    console.log("open modal");
    setModalOpen(true);
  };

  const handleCancelClick = () => {
    console.log("cancel modal");
    setModalOpen(false);
  };

  const renderModal = () => {
    return (
      <Modal key="edit-modal" showModal={true} width="thin">
        <ModalHeader title={modalTitle} />
        <ModalContent>
          <StyledAttributeModalContent>
            {modalData.elvl && (
              <AttributeElvl
                value={modalData.elvl}
                onChangeFn={(newElvl: Elvl) => {
                  console.log(newElvl);
                }}
              ></AttributeElvl>
            )}
          </StyledAttributeModalContent>
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              color="warning"
              onClick={() => {
                handleCancelClick();
              }}
            />
            <Button
              key="submit"
              label="Submit"
              color="primary"
              onClick={() => {
                handleAcceptClick();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
      </Modal>
    );
  };

  return (
    <StyledAttributeWrapper>
      <>{modalOpen && renderModal()}</>
      <Button
        key="add"
        icon={<MdSettings />}
        tooltip=""
        color="primary"
        onClick={() => {
          handleOpenModalClick();
        }}
      />
    </StyledAttributeWrapper>
  );
};

interface AttributeElvl {
  value: Elvl;
  onChangeFn: (value: Elvl) => void;
}
const AttributeElvl: React.FC<AttributeElvl> = ({ value, onChangeFn }) => {
  return (
    <ElvlToggle
      value={value}
      onChangeFn={(newValue: Elvl) => {
        onChangeFn(newValue);
      }}
    />
  );
};
