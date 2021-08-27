import {
  StyledAttributeWrapper,
  StyledAttributeModalContent,
  StyledAttributeModalRow,
  StyledAttributeModalRowLabel,
  StyledAttributeModalRowLabelText,
  StyledAttributeModalRowLabelIcon,
} from "./StatementEditorAttributesStyles";

import {
  certaintyDict,
  elvlDict,
  logicDict,
  moodDict,
  moodVariantsDict,
  partitivityDict,
  virtualityDict,
  operatorDict,
} from "@shared/dictionaries";

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
  Dropdown,
  Checkbox,
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
  Operator,
} from "@shared/enums";
import React, { useState, useMemo } from "react";
import { ElvlToggle } from "../..";
import { AttributeIcon } from "../../AttributeIcons/AttributeIcons";
import { Colors, Entities } from "types";

type AttributeName =
  | "certainty"
  | "elvl"
  | "logic"
  | "mood"
  | "moodvariant"
  | "virtuality"
  | "partitivity"
  | "operator"
  | "bundleStart"
  | "bundleEnd";

interface AttributeData {
  certainty?: Certainty;
  elvl?: Elvl;
  logic?: Logic;
  mood?: Mood[];
  moodvariant?: MoodVariant;
  virtuality?: Virtuality;
  partitivity?: Partitivity;
  operator?: Operator;
  bundleStart?: boolean;
  bundleEnd?: boolean;
}

interface StatementEditorAttributes {
  modalTitle: string;
  entityType?: ActantType;
  data: AttributeData;
  handleUpdate: (data: AttributeData) => void;
}

export const StatementEditorAttributes: React.FC<StatementEditorAttributes> = ({
  modalTitle,
  entityType,
  data,
  handleUpdate,
}) => {
  const [modalData, setModalData] = useState<AttributeData>(data);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleModalDataChange = (
    attributeName: AttributeName,
    newValue:
      | Certainty
      | Elvl
      | Logic
      | Mood[]
      | MoodVariant
      | Virtuality
      | Partitivity
      | Operator
      | boolean
  ) => {
    const newModalData = Object.assign({}, modalData);

    switch (attributeName) {
      case "logic":
        newModalData["logic"] = newValue as Logic;
        break;
      case "certainty":
        newModalData["certainty"] = newValue as Certainty;
        break;
      case "elvl":
        newModalData["elvl"] = newValue as Elvl;
        break;
      case "mood":
        newModalData["mood"] = newValue as Mood[];
        break;
      case "moodvariant":
        newModalData["moodvariant"] = newValue as MoodVariant;
        break;
      case "virtuality":
        newModalData["virtuality"] = newValue as Virtuality;
        break;
      case "partitivity":
        newModalData["partitivity"] = newValue as Partitivity;
        break;
      case "operator":
        newModalData["operator"] = newValue as Operator;
        break;
      case "bundleStart":
        newModalData["bundleStart"] = newValue as boolean;
        break;
      case "bundleEnd":
        newModalData["bundleEnd"] = newValue as boolean;
        break;
    }

    setModalData(newModalData);
  };

  const handleAcceptClick = () => {
    const updateModalData: AttributeData = {};
    Object.keys(modalData).forEach((modelDataKey) => {
      const modelDataValue = modalData[modelDataKey as AttributeName];

      if (modelDataValue) {
        //@ts-ignore
        updateModalData[modelDataKey as AttributeName] = modelDataValue;
      }
    });
    handleUpdate(updateModalData);
  };

  const handleOpenModalClick = () => {
    setModalOpen(true);
  };

  const handleCancelClick = () => {
    setModalOpen(false);
  };

  const renderModal = () => {
    return (
      <Modal
        key="edit-modal"
        showModal={true}
        disableBgClick={false}
        onClose={() => {
          handleCancelClick();
        }}
      >
        <ModalHeader
          title={modalTitle}
          color={entityType ? Entities[entityType].color : undefined}
        />
        <ModalContent>
          <StyledAttributeModalContent>
            {modalData.elvl && (
              <AttributeRow
                value={modalData.elvl}
                multi={false}
                items={elvlDict}
                label="Epistemic level"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("elvl", newValue as Elvl);
                }}
                icon={<AttributeIcon attributeName="elvl" />}
              ></AttributeRow>
            )}
            {modalData.logic && (
              <AttributeRow
                value={modalData.logic}
                multi={false}
                items={logicDict}
                label="Logical level"
                icon={<AttributeIcon attributeName="logic" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("logic", newValue as Logic);
                }}
              ></AttributeRow>
            )}
            {modalData.certainty && (
              <AttributeRow
                value={modalData.certainty}
                multi={false}
                items={certaintyDict}
                label="Certainty"
                icon={<AttributeIcon attributeName="certainty" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("certainty", newValue as Certainty);
                }}
              ></AttributeRow>
            )}
            {modalData.mood && (
              <AttributeRow
                value={modalData.mood}
                multi={true}
                items={moodDict}
                label="Mood"
                icon={<AttributeIcon attributeName="mood" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("mood", newValue as Mood[]);
                }}
              ></AttributeRow>
            )}
            {modalData.moodvariant && (
              <AttributeRow
                value={modalData.moodvariant}
                multi={false}
                items={moodVariantsDict}
                label="Mood Variant"
                icon={<AttributeIcon attributeName="moodvariant" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("moodvariant", newValue as MoodVariant);
                }}
              ></AttributeRow>
            )}
            {modalData.virtuality && (
              <AttributeRow
                value={modalData.virtuality}
                multi={false}
                items={virtualityDict}
                label="Virtuality"
                icon={<AttributeIcon attributeName="virtuality" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("virtuality", newValue as Virtuality);
                }}
              ></AttributeRow>
            )}
            {modalData.partitivity && (
              <AttributeRow
                value={modalData.partitivity}
                multi={false}
                items={partitivityDict}
                label="Partitivity"
                icon={<AttributeIcon attributeName="partitivity" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("partitivity", newValue as Partitivity);
                }}
              ></AttributeRow>
            )}
            {modalData.operator && (
              <AttributeRow
                value={modalData.operator}
                multi={false}
                items={operatorDict}
                label="Logical Operator"
                icon={<AttributeIcon attributeName="operator" />}
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("operator", newValue as Operator);
                }}
              ></AttributeRow>
            )}
            {modalData.operator && (
              <CheckboxRow
                value={modalData.bundleStart ? modalData.bundleStart : false}
                label="Bundle start"
                icon={<AttributeIcon attributeName="bundleStart" />}
                onChangeFn={(newValue: boolean) => {
                  handleModalDataChange("bundleStart", newValue as boolean);
                }}
              />
            )}
            {modalData.operator && (
              <CheckboxRow
                value={modalData.bundleEnd ? modalData.bundleEnd : false}
                label="Bundle end"
                icon={<AttributeIcon attributeName="bundleEnd" />}
                onChangeFn={(newValue: boolean) => {
                  handleModalDataChange("bundleEnd", newValue as boolean);
                }}
              />
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
              label="Apply changes"
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
    <>
      {modalOpen && renderModal()}
      <StyledAttributeWrapper>
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
    </>
  );
};

interface AttributeRow {
  value: string | string[];
  items: { value: string; label: string }[];
  label: string;
  icon: React.ReactElement;
  multi: boolean;
  onChangeFn: (value: string | string[]) => void;
}
const AttributeRow: React.FC<AttributeRow> = ({
  value,
  items,
  label,
  icon,
  multi,
  onChangeFn,
}) => {
  const selectedItem = useMemo(() => {
    return multi
      ? items.filter((i: any) => value.includes(i.value))
      : items.find((i: any) => i.value === value);
  }, [value]);

  return (
    <StyledAttributeModalRow>
      <StyledAttributeModalRowLabel>
        <StyledAttributeModalRowLabelIcon>
          {icon}
        </StyledAttributeModalRowLabelIcon>
        <StyledAttributeModalRowLabelText>
          {label}
        </StyledAttributeModalRowLabelText>
      </StyledAttributeModalRowLabel>
      <Dropdown
        width="full"
        isMulti={multi}
        options={items}
        value={selectedItem}
        onChange={(newValue: any) => {
          onChangeFn(
            multi
              ? newValue.map((v: any) => v.value)
              : (newValue.value as string | string[])
          );
        }}
      />
    </StyledAttributeModalRow>
  );
};

interface CheckboxRow {
  value: boolean;
  onChangeFn: (value: boolean) => void;
  label: string;
  icon: React.ReactElement;
}
export const CheckboxRow: React.FC<CheckboxRow> = ({
  value,
  onChangeFn,
  icon,
  label,
}) => {
  return (
    <StyledAttributeModalRow>
      <StyledAttributeModalRowLabel>
        <StyledAttributeModalRowLabelIcon>
          {icon}
        </StyledAttributeModalRowLabelIcon>
        <StyledAttributeModalRowLabelText>
          {label}
        </StyledAttributeModalRowLabelText>
      </StyledAttributeModalRowLabel>
      <Checkbox
        onChangeFn={(newValue: boolean) => onChangeFn(newValue)}
        id={label}
        value={value}
      />
    </StyledAttributeModalRow>
  );
};
