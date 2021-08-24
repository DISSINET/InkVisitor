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
  title: string;
  data: AttributeData;
  handleUpdate: (data: AttributeData) => void;
}

export const StatementEditorAttributes: React.FC<StatementEditorAttributes> = ({
  mode,
  title,
  data,
  handleUpdate,
}) => {
  const [modalData, setModalData] = useState<AttributeData>(data);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleAcceptClick = () => {};

  const handleCancelClick = () => {};

  const renderModal = () => {
    return (
      <Modal key="edit-modal" showModal={modalOpen} width="thin">
        <ModalHeader title={title} />
        <ModalContent>
          <StyledAttributeModalContent>
            Here comes the attributes
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

  return <StyledAttributeWrapper>{renderModal()}</StyledAttributeWrapper>;
};
