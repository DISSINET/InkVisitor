import React, { useMemo, useState } from "react";

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
import {
  elvlDict,
  logicDict,
  moodDict,
  moodVariantsDict,
  virtualityDict,
  partitivityDict,
  operatorDict,
  certaintyDict,
} from "@shared/dictionaries";
import {
  Tooltip,
  Button,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ButtonGroup,
  Loader,
} from "components";
import {
  StyledAttributeModalHeaderIcon,
  StyledAttributeModalHeaderWrapper,
  StyledAttributeWrapper,
} from "./AttributesEditorStyles";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";
import { AttributeDataObject, AttributeName, Entities, GroupName } from "types";
import { AttributesForm } from "./AttributesForm";
import {
  StyledAttributesColumn,
  StyledColumnHeading,
  StyledColumnWrap,
  StyledGridColumns,
} from "./AttributesGroupEditorStyles";

interface AttributesGroupEditor {
  modalTitle: string;
  typeClass?: ActantType;
  valueClass?: ActantType;
  data: AttributeDataObject;
  handleUpdate: (data: AttributeDataObject) => void;
  loading?: boolean;
  disabledAttributes?: AttributeName[];
  disabledAllAttributes?: boolean;
  disabledOpenModal?: boolean;
}

export const AttributesGroupEditor: React.FC<AttributesGroupEditor> = ({
  modalTitle,
  typeClass,
  valueClass,
  data,
  handleUpdate,
  loading,
  disabledAttributes = [],
  disabledAllAttributes = false,
  disabledOpenModal = false,
}) => {
  const [modalData, setModalData] = useState<AttributeDataObject>(data);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const somethingWasUpdated = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(modalData);
  }, [modalData, data]);

  const handleAcceptClick = () => {
    if (JSON.stringify(data) !== JSON.stringify(modalData)) {
      handleUpdate(modalData);
      setModalOpen(false);
    }
  };

  const handleCancelClick = () => {
    setModalData(data);
    setModalOpen(false);
  };

  const handleModalDataChange = (
    groupName: GroupName,
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
    const newModalData = Object.assign({}, modalData[groupName]);

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
    setModalData({ ...modalData, [groupName]: newModalData });
  };

  return (
    <div>
      <StyledAttributeWrapper>
        {/* <Tooltip
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
        > */}
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
        {/* </Tooltip> */}
      </StyledAttributeWrapper>

      <Modal
        key="edit-modal"
        showModal={modalOpen}
        disableBgClick={false}
        onClose={() => {
          handleCancelClick();
        }}
        onEnterPress={handleAcceptClick}
        width="full"
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
          // color={entityType ? Entities[entityType].color : undefined}
        />
        <ModalContent>
          <StyledGridColumns>
            <StyledAttributesColumn>
              <StyledColumnWrap color={Entities[ActantType.Statement].color}>
                <StyledColumnHeading>Statement</StyledColumnHeading>
                <AttributesForm
                  groupName="statement"
                  modalData={modalData.statement}
                  handleModalDataChange={handleModalDataChange}
                />
              </StyledColumnWrap>
            </StyledAttributesColumn>
            <StyledAttributesColumn>
              <StyledColumnWrap
                color={typeClass ? Entities[typeClass].color : undefined}
              >
                <StyledColumnHeading>Type</StyledColumnHeading>
                <AttributesForm
                  groupName="type"
                  modalData={modalData.type}
                  handleModalDataChange={handleModalDataChange}
                />
              </StyledColumnWrap>
            </StyledAttributesColumn>
            <StyledAttributesColumn>
              <StyledColumnWrap
                color={valueClass ? Entities[valueClass].color : undefined}
              >
                <StyledColumnHeading>Value</StyledColumnHeading>
                <AttributesForm
                  groupName="value"
                  modalData={modalData.value}
                  handleModalDataChange={handleModalDataChange}
                />
              </StyledColumnWrap>
            </StyledAttributesColumn>
          </StyledGridColumns>
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
    </div>
  );
};
