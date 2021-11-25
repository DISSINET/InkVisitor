import {
  StyledAttributeWrapper,
  StyledAttributeModalContent,
  StyledAttributeModalHeaderWrapper,
  StyledAttributeModalHeaderIcon,
} from "./AttributesEditorStyles";

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
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Tooltip,
  Loader,
} from "components";

import { MdSettings } from "react-icons/md";
import {
  ActantType,
  Certainty,
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
} from "@shared/enums";
import React, { useState, useMemo } from "react";
import { Entities } from "types";
import { CheckboxRow } from "./CheckboxRow/CheckboxRow";
import { AttributeRow } from "./AttributeRow/AttributeRow";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";

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
  entityType?: ActantType | false;
  data: AttributeData;
  handleUpdate: (data: AttributeData) => void;
  loading?: boolean;
  disabledAttributes?: AttributeName[];
  disabledAllAttributes?: boolean;
  disabledOpenModal?: boolean;
}

export const AttributesEditor: React.FC<StatementEditorAttributes> = ({
  modalTitle,
  entityType,
  data,
  handleUpdate,
  loading,
  disabledAttributes = [],
  disabledAllAttributes = false,
  disabledOpenModal = false,
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
      case "certainty":
        newModalData["certainty"] = newValue as Certainty;
        break;
    }

    setModalData(newModalData);
  };

  const somethingWasUpdated = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(modalData);
  }, [modalData, data]);

  const handleAcceptClick = () => {
    if (JSON.stringify(data) !== JSON.stringify(modalData)) {
      handleUpdate(modalData);
      setModalOpen(false);
    }
    // const updateModalData: AttributeData = {};
    // Object.keys(modalData).forEach((modelDataKey) => {
    //   const modelDataValue = modalData[modelDataKey as AttributeName];

    //   if (modelDataValue) {
    //     //@ts-ignore
    //     updateModalData[modelDataKey as AttributeName] = modelDataValue;
    //   }
    // });
    // if (somethingWasUpdated) {
    //   handleUpdate(updateModalData);
    // }
  };

  const handleOpenModalClick = () => {
    setModalOpen(true);
  };

  const handleCancelClick = () => {
    setModalData(data);
    setModalOpen(false);
  };

  const renderModal = (showModal: boolean) => {
    return (
      <Modal
        key="edit-modal"
        showModal={showModal}
        disableBgClick={false}
        onClose={() => {
          handleCancelClick();
        }}
        onEnterPress={handleAcceptClick}
      >
        <ModalHeader
          title={
            <StyledAttributeModalHeaderWrapper>
              <StyledAttributeModalHeaderIcon>
                <MdSettings />
              </StyledAttributeModalHeaderIcon>
              {modalTitle}
            </StyledAttributeModalHeaderWrapper>
          }
          color={entityType ? Entities[entityType].color : undefined}
        />
        <ModalContent>
          <StyledAttributeModalContent>
            {modalData.elvl && (
              <AttributeRow
                disabled={
                  disabledAllAttributes || disabledAttributes.includes("elvl")
                }
                value={modalData.elvl}
                multi={false}
                items={elvlDict}
                label="Epistemic level"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("elvl", newValue as Elvl);
                }}
                attributeName="elvl"
              />
            )}
            {modalData.logic && (
              <AttributeRow
                disabled={
                  disabledAllAttributes || disabledAttributes.includes("logic")
                }
                value={modalData.logic}
                multi={false}
                items={logicDict}
                label="Logic"
                attributeName="logic"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("logic", newValue as Logic);
                }}
              />
            )}
            {modalData.mood && (
              <AttributeRow
                disabled={
                  disabledAllAttributes || disabledAttributes.includes("mood")
                }
                value={modalData.mood}
                multi={true}
                items={moodDict}
                label="Mood"
                attributeName="mood"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("mood", newValue as Mood[]);
                }}
              />
            )}
            {modalData.moodvariant && (
              <AttributeRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("moodvariant")
                }
                value={modalData.moodvariant}
                multi={false}
                items={moodVariantsDict}
                label="Mood Variant"
                attributeName="moodvariant"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("moodvariant", newValue as MoodVariant);
                }}
              />
            )}
            {modalData.virtuality && (
              <AttributeRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("virtuality")
                }
                value={modalData.virtuality}
                multi={false}
                items={virtualityDict}
                label="Virtuality"
                attributeName="virtuality"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("virtuality", newValue as Virtuality);
                }}
              />
            )}
            {modalData.partitivity && (
              <AttributeRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("partitivity")
                }
                value={modalData.partitivity}
                multi={false}
                items={partitivityDict}
                label="Partitivity"
                attributeName="partitivity"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("partitivity", newValue as Partitivity);
                }}
              />
            )}
            {modalData.operator && (
              <AttributeRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("operator")
                }
                value={modalData.operator}
                multi={false}
                items={operatorDict}
                label="Logical Operator"
                attributeName="operator"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("operator", newValue as Operator);
                }}
              />
            )}
            {modalData.operator && (
              <CheckboxRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("bundleStart")
                }
                value={modalData.bundleStart ? modalData.bundleStart : false}
                label="Bundle start"
                attributeName="bundleStart"
                onChangeFn={(newValue: boolean) => {
                  handleModalDataChange("bundleStart", newValue as boolean);
                }}
              />
            )}
            {modalData.operator && (
              <CheckboxRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("bundleEnd")
                }
                value={modalData.bundleEnd ? modalData.bundleEnd : false}
                label="Bundle end"
                attributeName="bundleEnd"
                onChangeFn={(newValue: boolean) => {
                  handleModalDataChange("bundleEnd", newValue as boolean);
                }}
              />
            )}
            {modalData.certainty && (
              <AttributeRow
                disabled={
                  disabledAllAttributes ||
                  disabledAttributes.includes("certainty")
                }
                value={modalData.certainty}
                multi={false}
                items={certaintyDict}
                label="Certainty"
                attributeName="certainty"
                onChangeFn={(newValue: string | string[]) => {
                  handleModalDataChange("certainty", newValue as Certainty);
                }}
              ></AttributeRow>
            )}
          </StyledAttributeModalContent>
        </ModalContent>

        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              inverted={true}
              color="primary"
              onClick={() => {
                handleCancelClick();
              }}
            />
            <Button
              key="submit"
              label="Apply changes"
              color="primary"
              disabled={disabledAllAttributes || !somethingWasUpdated}
              onClick={() => {
                handleAcceptClick();
              }}
            />
          </ButtonGroup>
        </ModalFooter>
        <Loader show={loading} />
      </Modal>
    );
  };

  return (
    <>
      {modalOpen && renderModal(modalOpen)}

      <StyledAttributeWrapper>
        <Tooltip
          attributes={[
            <TooltipAttributeRow
              key="elvl"
              attributeName="elvl"
              value={data.elvl}
              items={elvlDict}
            />,
            <TooltipAttributeRow
              key="logic"
              attributeName="logic"
              value={data.logic}
              items={logicDict}
            />,
            <TooltipAttributeRow
              key="mood"
              attributeName="mood"
              value={data.mood}
              items={moodDict}
            />,
            <TooltipAttributeRow
              key="moodvariant"
              attributeName="moodvariant"
              value={data.moodvariant}
              items={moodVariantsDict}
            />,
            <TooltipAttributeRow
              key="virtuality"
              attributeName="virtuality"
              value={data.virtuality}
              items={virtualityDict}
            />,
            <TooltipAttributeRow
              key="partitivity"
              attributeName="partitivity"
              value={data.partitivity}
              items={partitivityDict}
            />,
            <TooltipAttributeRow
              key="operator"
              attributeName="operator"
              value={data.operator}
              items={operatorDict}
            />,
            <TooltipBooleanRow
              key="bundleStart"
              attributeName="bundleStart"
              label="bundle start"
              show={data.bundleStart ? data.bundleStart : false}
            />,
            <TooltipBooleanRow
              key="bundleEnd"
              attributeName="bundleEnd"
              label="bundle end"
              show={data.bundleEnd ? data.bundleEnd : false}
            />,
            <TooltipAttributeRow
              key="certainty"
              attributeName="certainty"
              value={data.certainty}
              items={certaintyDict}
            />,
          ]}
        >
          <div>
            <Button
              key="settings"
              disabled={disabledOpenModal}
              icon={<MdSettings />}
              inverted={true}
              color="plain"
              onClick={() => {
                handleOpenModalClick();
              }}
            />
          </div>
        </Tooltip>
      </StyledAttributeWrapper>
    </>
  );
};
