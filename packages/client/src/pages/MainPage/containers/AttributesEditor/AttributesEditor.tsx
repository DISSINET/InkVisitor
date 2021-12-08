import {
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
import { AttributeData, AttributeName, Entities } from "types";
import { CheckboxRow } from "./CheckboxRow/CheckboxRow";
import { AttributeRow } from "./AttributeRow/AttributeRow";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";
import { AttributesForm } from "./AttributesForm";

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
          <AttributesForm
            handleModalDataChange={handleModalDataChange}
            modalData={modalData}
            disabledAllAttributes={disabledAllAttributes}
            disabledAttributes={disabledAttributes}
          />
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

      <div>
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
              onClick={() => setModalOpen(true)}
            />
          </div>
        </Tooltip>
      </div>
    </>
  );
};
