import { StyledAttributeWrapper } from "./StatementEditorAttributeModalStyles";

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

interface StatementEditorAttributeModal {
  mode: "action" | "actant" | "prop" | "prop-value" | "prop-type";
  title: string;
  inputData: AttributeData;
  handleCancel: Function;
  handleAccept: (data: AttributeData) => void;
}

export const StatementEditorAttributeModal: React.FC<StatementEditorAttributeModal> =
  ({ mode, title, inputData, handleCancel, handleAccept }) => {
    const [data, setData] = useState<AttributeData>(inputData);

    const handleAcceptClick = () => {
      handleAccept(data);
    };

    const handleCancelClick = () => {
      handleCancel();
    };

    return (
      <Modal key="edit-modal" showModal={true} width="thin">
        <ModalHeader title={title} />
        <ModalContent>
          <StyledAttributeWrapper>
            Here comes the attributes
          </StyledAttributeWrapper>
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
