import React, { useEffect, useMemo, useState } from "react";

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
} from "./AttributesEditorStyles";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";
import {
  AttributeData,
  AttributeDataObject,
  AttributeName,
  Entities,
  GroupName,
} from "types";
import { AttributesForm } from "./AttributesForm";
import {
  StyledColumnHeading,
  StyledColumnWrap,
  StyledEntityWrap,
  StyledGridColumns,
  StyledTooltipGrid,
  StyledTooltipHeading,
} from "./AttributesGroupEditorStyles";
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
import { IActant } from "@shared/types";
import { EntitySuggester, EntityTag } from "..";
import { FaUnlink } from "react-icons/fa";

interface AttributesGroupEditor {
  modalTitle: string;
  propTypeActant?: IActant;
  classesPropType: ActantType[];
  propValueActant?: IActant;
  classesPropValue: ActantType[];
  excludedSuggesterEntities: ActantType[];
  data: AttributeDataObject;
  handleUpdate: (data: AttributeDataObject) => void;
  loading?: boolean;
  disabledAttributes?: AttributeName[];
  disabledAllAttributes?: boolean;
  disabledOpenModal?: boolean;
}

export const AttributesGroupEditor: React.FC<AttributesGroupEditor> = ({
  modalTitle,
  propTypeActant,
  classesPropType,
  propValueActant,
  classesPropValue,
  excludedSuggesterEntities,
  data,
  handleUpdate,
  loading,
  disabledAttributes = [],
  disabledAllAttributes = false,
  disabledOpenModal = false,
}) => {
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<AttributeDataObject>(data);

  useEffect(() => {
    setModalData(data);
  }, [data]);

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

  const handleSetModalData = (
    newModalData: AttributeData,
    groupName?: GroupName
  ) => {
    if (groupName) {
      setModalData({ ...modalData, [groupName]: newModalData });
    }
  };

  const getTooltipColumn = (data: AttributeData) => {
    return (
      <div>
        {data.elvl && (
          <TooltipAttributeRow
            key="elvl"
            attributeName="elvl"
            value={data.elvl}
            items={elvlDict}
          />
        )}
        {data.logic && (
          <TooltipAttributeRow
            key="logic"
            attributeName="logic"
            value={data.logic}
            items={logicDict}
          />
        )}
        {data.mood && (
          <TooltipAttributeRow
            key="mood"
            attributeName="mood"
            value={data.mood}
            items={moodDict}
          />
        )}
        {data.moodvariant && (
          <TooltipAttributeRow
            key="moodvariant"
            attributeName="moodvariant"
            value={data.moodvariant}
            items={moodVariantsDict}
          />
        )}
        {data.virtuality && (
          <TooltipAttributeRow
            key="virtuality"
            attributeName="virtuality"
            value={data.virtuality}
            items={virtualityDict}
          />
        )}
        {data.partitivity && (
          <TooltipAttributeRow
            key="partitivity"
            attributeName="partitivity"
            value={data.partitivity}
            items={partitivityDict}
          />
        )}
        {data.operator && (
          <TooltipAttributeRow
            key="operator"
            attributeName="operator"
            value={data.operator}
            items={operatorDict}
          />
        )}
        {data.bundleStart && (
          <TooltipBooleanRow
            key="bundleStart"
            attributeName="bundleStart"
            label="bundle start"
            show={data.bundleStart ? data.bundleStart : false}
          />
        )}
        {data.bundleEnd && (
          <TooltipBooleanRow
            key="bundleEnd"
            attributeName="bundleEnd"
            label="bundle end"
            show={data.bundleEnd ? data.bundleEnd : false}
          />
        )}
        {data.certainty && (
          <TooltipAttributeRow
            key="certainty"
            attributeName="certainty"
            value={data.certainty}
            items={certaintyDict}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <Tooltip
        position="top right"
        attributes={
          <StyledTooltipGrid>
            <div>
              <StyledTooltipHeading>Statement</StyledTooltipHeading>
              {getTooltipColumn(modalData.statement)}
            </div>
            <div>
              <StyledTooltipHeading>Type</StyledTooltipHeading>
              {getTooltipColumn(modalData.type)}
            </div>
            <div>
              <StyledTooltipHeading>Value</StyledTooltipHeading>
              {getTooltipColumn(modalData.value)}
            </div>
          </StyledTooltipGrid>
        }
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
        />
        <ModalContent>
          <StyledGridColumns>
            <StyledColumnWrap color={Entities[ActantType.Statement].color}>
              <StyledColumnHeading>Statement</StyledColumnHeading>

              <AttributesForm
                groupName="statement"
                modalData={modalData.statement}
                setNewModalData={handleSetModalData}
              />
            </StyledColumnWrap>
            <StyledColumnWrap
              color={
                propTypeActant
                  ? Entities[propTypeActant.class].color
                  : undefined
              }
            >
              <StyledColumnHeading>Type</StyledColumnHeading>

              <AttributesForm
                groupName="type"
                modalData={modalData.type}
                setNewModalData={handleSetModalData}
              />
              <StyledEntityWrap>
                {propTypeActant ? (
                  <EntityTag
                    actant={propTypeActant}
                    fullWidth
                    button={
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        color="plain"
                        inverted={true}
                        tooltip="unlink actant"
                        onClick={() => {
                          // updateProp(prop.id, {
                          //   type: {
                          //     ...prop.type,
                          //     ...{ id: "" },
                          //   },
                          // });
                        }}
                      />
                    }
                  />
                ) : (
                  <EntitySuggester
                    // statementTerritoryId={statement.data.territory.id}
                    openDetailOnCreate
                    onSelected={(newSelectedId: string) => {
                      // updateProp(prop.id, {
                      //   type: {
                      //     ...prop.type,
                      //     ...{ id: newSelectedId },
                      //   },
                      // });
                    }}
                    categoryTypes={classesPropType}
                    inputWidth={"full"}
                    excludedEntities={excludedSuggesterEntities}
                  />
                )}
              </StyledEntityWrap>
            </StyledColumnWrap>
            <StyledColumnWrap
              color={
                propValueActant
                  ? Entities[propValueActant.class].color
                  : undefined
              }
            >
              <StyledColumnHeading>Value</StyledColumnHeading>
              <AttributesForm
                groupName="value"
                modalData={modalData.value}
                setNewModalData={handleSetModalData}
              />
              <StyledEntityWrap>
                {propValueActant ? (
                  <EntityTag
                    actant={propValueActant}
                    fullWidth
                    tooltipPosition="left center"
                    button={
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        tooltip="unlink actant"
                        color="plain"
                        inverted={true}
                        onClick={() => {
                          // updateProp(prop.id, {
                          //   value: {
                          //     ...prop.value,
                          //     ...{ id: "" },
                          //   },
                          // });
                        }}
                      />
                    }
                  />
                ) : (
                  <EntitySuggester
                    // statementTerritoryId={statement.data.territory.id}
                    openDetailOnCreate
                    onSelected={(newSelectedId: string) => {
                      // updateProp(prop.id, {
                      //   value: {
                      //     ...prop.type,
                      //     ...{ id: newSelectedId },
                      //   },
                      // });
                    }}
                    categoryTypes={classesPropValue}
                    inputWidth={"full"}
                    excludedEntities={excludedSuggesterEntities}
                  />
                )}
              </StyledEntityWrap>
            </StyledColumnWrap>
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
