import React, { useMemo, useState } from "react";

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
import { FaUnlink } from "react-icons/fa";
import { MdSettings } from "react-icons/md";
import {
  AttributeData,
  EntityColors,
  PropAttributeFilter,
  PropAttributeGroup,
  PropAttributeGroupDataObject,
  PropAttributeName,
} from "types";
import {
  StyledAttributeModalHeaderIcon,
  StyledAttributeModalHeaderWrapper,
} from "./AttributesEditorStyles";
import { AttributesForm } from "./AttributesForm";
import {
  StyledColumnHeading,
  StyledColumnWrap,
  StyledEntityWrap,
  StyledGridColumns,
  StyledSuggesterWrap,
  StyledTooltipGrid,
  StyledTooltipHeading,
} from "./AttributesGroupEditorStyles";
import { TooltipAttributeRow } from "./TooltipAttributeRow/TooltipAttributeRow";
import { TooltipBooleanRow } from "./TooltipBooleanRow/TooltipBooleanRow";

interface AttributesGroupEditor {
  modalTitle: string;
  modalOpen: boolean;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  statementId: string;
  propTypeActant?: IEntity;
  classesPropType: EntityClass[];
  propValueActant?: IEntity;
  classesPropValue: EntityClass[];
  excludedSuggesterEntities: EntityClass[];
  data: PropAttributeGroupDataObject;
  handleUpdate: (data: PropAttributeGroupDataObject) => void;
  updateProp: (propId: string, changes: any) => void;
  loading?: boolean;
  disabledAttributes?: PropAttributeFilter;
  disabledAllAttributes?: boolean;
  disabledOpenModal?: boolean;
  userCanEdit?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
}

export const AttributesGroupEditor: React.FC<AttributesGroupEditor> = ({
  modalTitle,
  modalOpen,
  setModalOpen,
  propTypeActant,
  classesPropType,
  propValueActant,
  classesPropValue,
  excludedSuggesterEntities,
  data,
  handleUpdate,
  updateProp,
  loading,
  disabledAttributes = {} as PropAttributeFilter,
  disabledAllAttributes = false,
  disabledOpenModal = false,
  statementId,
  userCanEdit,
  isInsideTemplate = false,
  territoryParentId,
}) => {
  const [modalData, setModalData] =
    useState<PropAttributeGroupDataObject>(data);

  const somethingWasUpdated = useMemo(() => {
    return JSON.stringify(data) !== JSON.stringify(modalData);
  }, [modalData, data]);

  const handleAcceptClick = () => {
    if (JSON.stringify(data) !== JSON.stringify(modalData)) {
      const newModalData = {
        ...modalData,
        type: {
          ...{ id: propTypeActant?.id },
          ...modalData.type,
        },
        value: {
          ...{ id: propValueActant?.id },
          ...modalData.value,
        },
      };
      handleUpdate(newModalData);
      setModalOpen(false);
    }
  };

  const handleCancelClick = () => {
    setModalData(data);
    setModalOpen(false);
  };

  const handleSetModalData = (
    newModalData: AttributeData,
    groupName?: PropAttributeGroup
  ) => {
    if (groupName) {
      setModalData({ ...modalData, [groupName]: newModalData });
    }
  };

  const getTooltipColumn = (
    data: AttributeData,
    disabledAttributes: PropAttributeName[] | undefined
  ) => {
    const disabledAttributesVal = disabledAttributes || [];
    return (
      <div>
        {data.elvl && !disabledAttributesVal?.includes("elvl") && (
          <TooltipAttributeRow
            key="elvl"
            attributeName="elvl"
            value={data.elvl}
            items={elvlDict}
          />
        )}
        {data.logic && !disabledAttributesVal?.includes("logic") && (
          <TooltipAttributeRow
            key="logic"
            attributeName="logic"
            value={data.logic}
            items={logicDict}
          />
        )}
        {data.mood && !disabledAttributesVal?.includes("mood") && (
          <TooltipAttributeRow
            key="mood"
            attributeName="mood"
            value={data.mood}
            items={moodDict}
          />
        )}
        {data.moodvariant &&
          !disabledAttributesVal?.includes("moodvariant") && (
            <TooltipAttributeRow
              key="moodvariant"
              attributeName="moodvariant"
              value={data.moodvariant}
              items={moodVariantsDict}
            />
          )}
        {data.virtuality && !disabledAttributesVal?.includes("virtuality") && (
          <TooltipAttributeRow
            key="virtuality"
            attributeName="virtuality"
            value={data.virtuality}
            items={virtualityDict}
          />
        )}
        {data.partitivity &&
          !disabledAttributesVal?.includes("partitivity") && (
            <TooltipAttributeRow
              key="partitivity"
              attributeName="partitivity"
              value={data.partitivity}
              items={partitivityDict}
            />
          )}
        {data.bundleOperator &&
          !disabledAttributesVal?.includes("bundleOperator") && (
            <TooltipAttributeRow
              key="bundleOperator"
              attributeName="bundleOperator"
              value={data.bundleOperator}
              items={operatorDict}
            />
          )}
        {data.bundleStart &&
          !disabledAttributesVal?.includes("bundleStart") && (
            <TooltipBooleanRow
              key="bundleStart"
              attributeName="bundleStart"
              label="bundle start"
              show={data.bundleStart ? data.bundleStart : false}
            />
          )}
        {data.bundleEnd && !disabledAttributesVal?.includes("bundleEnd") && (
          <TooltipBooleanRow
            key="bundleEnd"
            attributeName="bundleEnd"
            label="bundle end"
            show={data.bundleEnd ? data.bundleEnd : false}
          />
        )}
        {data.certainty && !disabledAttributesVal?.includes("certainty") && (
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

  const dissabledStatement =
    disabledAttributes.statement as PropAttributeName[];
  const dissabledType = disabledAttributes.type as PropAttributeName[];
  const dissabledValue = disabledAttributes.value as PropAttributeName[];
  return (
    <div>
      <Tooltip
        position="top right"
        attributes={
          <StyledTooltipGrid>
            <div>
              <StyledTooltipHeading>Statement</StyledTooltipHeading>
              {getTooltipColumn(
                modalData.statement,
                disabledAttributes.statement
              )}
            </div>
            <div>
              <StyledTooltipHeading>Type</StyledTooltipHeading>
              {getTooltipColumn(modalData.type, disabledAttributes.type)}
            </div>
            <div>
              <StyledTooltipHeading>Value</StyledTooltipHeading>
              {getTooltipColumn(modalData.value, disabledAttributes.value)}
            </div>
          </StyledTooltipGrid>
        }
      >
        <div>
          <Button
            key="settings"
            disabled={disabledOpenModal}
            icon={<MdSettings />}
            inverted
            color="plain"
            onClick={() => setModalOpen(true)}
          />
        </div>
      </Tooltip>

      <Modal
        key="edit-modal"
        showModal={modalOpen}
        onClose={() => {
          handleCancelClick();
        }}
        onEnterPress={handleAcceptClick}
        width={1200}
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
            <StyledColumnWrap color={EntityColors[EntityClass.Statement].color}>
              <StyledColumnHeading>Statement</StyledColumnHeading>

              <AttributesForm
                groupName="statement"
                disabledAttributes={dissabledStatement}
                modalData={modalData.statement}
                setNewModalData={handleSetModalData}
              />
            </StyledColumnWrap>
            <StyledColumnWrap
              color={
                propTypeActant
                  ? EntityColors[propTypeActant.class].color
                  : undefined
              }
            >
              <StyledColumnHeading>Type</StyledColumnHeading>

              <AttributesForm
                groupName="type"
                disabledAttributes={dissabledType}
                modalData={modalData.type}
                setNewModalData={handleSetModalData}
              />
              {propTypeActant ? (
                <StyledEntityWrap>
                  <EntityTag
                    entity={propTypeActant}
                    fullWidth
                    button={
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        color="plain"
                        inverted
                        tooltip="unlink actant"
                        onClick={() => {
                          updateProp(statementId, {
                            type: {
                              ...data.type,
                              ...{ id: "" },
                            },
                          });
                        }}
                      />
                    }
                  />
                </StyledEntityWrap>
              ) : (
                userCanEdit && (
                  <StyledSuggesterWrap>
                    <EntitySuggester
                      disableCreate
                      openDetailOnCreate
                      onSelected={(newSelectedId: string) => {
                        updateProp(statementId, {
                          type: {
                            ...data.type,
                            ...{ id: newSelectedId },
                          },
                        });
                      }}
                      categoryTypes={classesPropType}
                      inputWidth={"full"}
                      excludedEntities={excludedSuggesterEntities}
                      isInsideTemplate={isInsideTemplate}
                      territoryParentId={territoryParentId}
                    />
                  </StyledSuggesterWrap>
                )
              )}
            </StyledColumnWrap>
            <StyledColumnWrap
              color={
                propValueActant
                  ? EntityColors[propValueActant.class].color
                  : undefined
              }
            >
              <StyledColumnHeading>Value</StyledColumnHeading>
              <AttributesForm
                groupName="value"
                disabledAttributes={dissabledValue}
                modalData={modalData.value}
                setNewModalData={handleSetModalData}
              />
              {propValueActant ? (
                <StyledEntityWrap>
                  <EntityTag
                    entity={propValueActant}
                    fullWidth
                    tooltipPosition="left center"
                    button={
                      <Button
                        key="d"
                        icon={<FaUnlink />}
                        tooltip="unlink actant"
                        color="plain"
                        inverted
                        onClick={() => {
                          updateProp(statementId, {
                            value: {
                              ...data.value,
                              ...{ id: "" },
                            },
                          });
                        }}
                      />
                    }
                  />
                </StyledEntityWrap>
              ) : (
                userCanEdit && (
                  <StyledSuggesterWrap>
                    <EntitySuggester
                      disableCreate
                      openDetailOnCreate
                      onSelected={(newSelectedId: string) => {
                        updateProp(statementId, {
                          value: {
                            ...data.type,
                            ...{ id: newSelectedId },
                          },
                        });
                      }}
                      categoryTypes={classesPropValue}
                      inputWidth={"full"}
                      excludedEntities={excludedSuggesterEntities}
                      isInsideTemplate={isInsideTemplate}
                      territoryParentId={territoryParentId}
                    />
                  </StyledSuggesterWrap>
                )
              )}
            </StyledColumnWrap>
          </StyledGridColumns>
        </ModalContent>
        <ModalFooter>
          <ButtonGroup>
            <Button
              key="cancel"
              label="Cancel"
              inverted
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
