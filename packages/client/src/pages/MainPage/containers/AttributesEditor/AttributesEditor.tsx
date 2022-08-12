import {
  certaintyDict,
  elvlDict,
  logicDict,
  moodDict,
  moodVariantsDict,
  operatorDict,
  partitivityDict,
  virtualityDict,
} from "@shared/dictionaries";
import { EntityClass } from "@shared/enums";
import { IEntity } from "@shared/types";
import {
  Button,
  ButtonGroup,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { FaUnlink } from "react-icons/fa";
import { MdSettings } from "react-icons/md";
import { excludedSuggesterEntities } from "Theme/constants";
import { AttributeData, EntityColors, PropAttributeName } from "types";
import {
  StyledAttributeModalHeaderIcon,
  StyledAttributeModalHeaderWrapper,
  StyledContentWrap,
  StyledEntityWrap,
  StyledSuggesterWrap,
} from "./AttributesEditorStyles";
import { AttributesForm } from "./AttributesForm";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";

interface AttributesEditor {
  modalTitle: string;
  entity?: IEntity;
  data: AttributeData;
  handleUpdate: (
    data: AttributeData | { actant: string } | { action: string }
  ) => void;
  updateActantId?: (newId: string) => void;
  classEntitiesActant?: EntityClass[];
  loading: boolean;
  disabledAttributes?: PropAttributeName[];
  disabledAllAttributes?: boolean;
  disabledOpenModal?: boolean;
  userCanEdit?: boolean;

  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isInsideTemplate: boolean;
  territoryParentId?: string;
}

const AttributesEditor: React.FC<AttributesEditor> = ({
  modalTitle,
  entity,
  data,
  handleUpdate,
  updateActantId = () => {},
  classEntitiesActant = [],
  loading,
  disabledAttributes = [] as PropAttributeName[],
  disabledAllAttributes = false,
  disabledOpenModal = false,
  userCanEdit = false,
  modalOpen,
  setModalOpen,
  isInsideTemplate = false,
  territoryParentId,
}) => {
  const [modalData, setModalData] = useState<AttributeData>(data);

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
        key="bundleOperator"
        attributeName="bundleOperator"
        value={data.bundleOperator}
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

      <Modal
        key="edit-modal"
        width="normal"
        showModal={modalOpen}
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
        />
        <ModalContent>
          <StyledContentWrap
            color={entity ? EntityColors[entity.class].color : undefined}
          >
            <AttributesForm
              modalData={modalData}
              disabledAllAttributes={disabledAllAttributes}
              disabledAttributes={disabledAttributes}
              setNewModalData={(newModalData: AttributeData) => {
                setModalData(newModalData);
              }}
            />
            {entity ? (
              <StyledEntityWrap>
                <EntityTag
                  entity={entity}
                  fullWidth
                  button={
                    userCanEdit && (
                      <Button
                        key="d"
                        tooltip="unlink actant"
                        icon={<FaUnlink />}
                        color="plain"
                        inverted={true}
                        onClick={() => {
                          updateActantId("");
                        }}
                      />
                    )
                  }
                />
              </StyledEntityWrap>
            ) : (
              userCanEdit && (
                <StyledSuggesterWrap>
                  <EntitySuggester
                    onSelected={(newSelectedId: string) => {
                      updateActantId(newSelectedId);
                    }}
                    categoryTypes={classEntitiesActant}
                    excludedEntities={excludedSuggesterEntities}
                    isInsideTemplate={isInsideTemplate}
                    territoryParentId={territoryParentId}
                  />
                </StyledSuggesterWrap>
              )
            )}
          </StyledContentWrap>
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
    </>
  );
};

export default AttributesEditor;
