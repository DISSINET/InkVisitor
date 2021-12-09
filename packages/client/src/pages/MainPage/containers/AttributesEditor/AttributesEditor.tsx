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
import React, { useState, useMemo, useEffect } from "react";
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

  useEffect(() => {
    setModalData(data);
  }, [data]);

  const handleSetModalData = (newModalData: AttributeData) => {
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
            modalData={modalData}
            disabledAllAttributes={disabledAllAttributes}
            disabledAttributes={disabledAttributes}
            setNewModalData={handleSetModalData}
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

  const getTooltipAttributes = () => (
    <>
      <TooltipAttributeRow
        key="elvl"
        attributeName="elvl"
        value={data.elvl}
        items={elvlDict}
      />
      <TooltipAttributeRow
        key="logic"
        attributeName="logic"
        value={data.logic}
        items={logicDict}
      />
      <TooltipAttributeRow
        key="mood"
        attributeName="mood"
        value={data.mood}
        items={moodDict}
      />
      <TooltipAttributeRow
        key="moodvariant"
        attributeName="moodvariant"
        value={data.moodvariant}
        items={moodVariantsDict}
      />
      <TooltipAttributeRow
        key="virtuality"
        attributeName="virtuality"
        value={data.virtuality}
        items={virtualityDict}
      />
      <TooltipAttributeRow
        key="partitivity"
        attributeName="partitivity"
        value={data.partitivity}
        items={partitivityDict}
      />
      <TooltipAttributeRow
        key="operator"
        attributeName="operator"
        value={data.operator}
        items={operatorDict}
      />
      <TooltipBooleanRow
        key="bundleStart"
        attributeName="bundleStart"
        label="bundle start"
        show={data.bundleStart ? data.bundleStart : false}
      />
      <TooltipBooleanRow
        key="bundleEnd"
        attributeName="bundleEnd"
        label="bundle end"
        show={data.bundleEnd ? data.bundleEnd : false}
      />
      <TooltipAttributeRow
        key="certainty"
        attributeName="certainty"
        value={data.certainty}
        items={certaintyDict}
      />
    </>
  );
  return (
    <>
      {modalOpen && renderModal(modalOpen)}

      <div>
        <Tooltip attributes={<div>{getTooltipAttributes()}</div>}>
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
