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
import { EntityEnums } from "@shared/enums";
import React from "react";
import { AttributeData, PropAttributeGroup, PropAttributeName } from "types";
import { AttributeRow } from "./AttributeRow/AttributeRow";
import { StyledAttributeTable } from "./AttributesEditorStyles";
import { CheckboxRow } from "./CheckboxRow/CheckboxRow";

interface AttributesForm {
  groupName?: PropAttributeGroup;
  modalData: AttributeData;
  disabledAttributes?: PropAttributeName[];
  disabledAllAttributes?: boolean;
  setNewModalData: (
    newModalData: AttributeData,
    groupName?: PropAttributeGroup
  ) => void;
}
export const AttributesForm: React.FC<AttributesForm> = ({
  groupName,
  modalData,
  disabledAttributes = [],
  disabledAllAttributes = false,
  setNewModalData,
}) => {
  const handleDataChange = (
    attributeName: PropAttributeName,
    newValue:
      | EntityEnums.Certainty
      | EntityEnums.Elvl
      | EntityEnums.Logic
      | EntityEnums.Mood[]
      | EntityEnums.MoodVariant
      | EntityEnums.Virtuality
      | EntityEnums.Partitivity
      | EntityEnums.Operator
      | boolean,
    groupName?: PropAttributeGroup
  ) => {
    const newModalData = { ...modalData };

    switch (attributeName) {
      case "logic":
        newModalData["logic"] = newValue as EntityEnums.Logic;
        break;
      case "elvl":
        newModalData["elvl"] = newValue as EntityEnums.Elvl;
        break;
      case "mood":
        newModalData["mood"] = newValue as EntityEnums.Mood[];
        break;
      case "moodvariant":
        newModalData["moodvariant"] = newValue as EntityEnums.MoodVariant;
        break;
      case "virtuality":
        newModalData["virtuality"] = newValue as EntityEnums.Virtuality;
        break;
      case "partitivity":
        newModalData["partitivity"] = newValue as EntityEnums.Partitivity;
        break;
      case "bundleOperator":
        newModalData["bundleOperator"] = newValue as EntityEnums.Operator;
        break;
      case "bundleStart":
        newModalData["bundleStart"] = newValue as boolean;
        break;
      case "bundleEnd":
        newModalData["bundleEnd"] = newValue as boolean;
        break;
      case "certainty":
        newModalData["certainty"] = newValue as EntityEnums.Certainty;
        break;
    }
    setNewModalData(newModalData, groupName);
  };

  return (
    <StyledAttributeTable>
      {modalData.elvl && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("elvl")
          }
          value={modalData.elvl}
          items={elvlDict}
          label="Epistemic level"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("elvl", newValue as EntityEnums.Elvl, groupName);
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
          items={logicDict}
          label="Logic"
          attributeName="logic"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("logic", newValue as EntityEnums.Logic, groupName);
          }}
        />
      )}
      {modalData.mood && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("mood")
          }
          value={modalData.mood}
          multi
          items={moodDict}
          label="Mood"
          attributeName="mood"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("mood", newValue as EntityEnums.Mood[], groupName);
          }}
        />
      )}
      {modalData.moodvariant && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("moodvariant")
          }
          value={modalData.moodvariant}
          items={moodVariantsDict}
          label="Mood Variant"
          attributeName="moodvariant"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange(
              "moodvariant",
              newValue as EntityEnums.MoodVariant,
              groupName
            );
          }}
        />
      )}
      {modalData.virtuality && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("virtuality")
          }
          value={modalData.virtuality}
          items={virtualityDict}
          label="Virtuality"
          attributeName="virtuality"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange(
              "virtuality",
              newValue as EntityEnums.Virtuality,
              groupName
            );
          }}
        />
      )}
      {modalData.partitivity && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("partitivity")
          }
          value={modalData.partitivity}
          items={partitivityDict}
          label="Partitivity"
          attributeName="partitivity"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange(
              "partitivity",
              newValue as EntityEnums.Partitivity,
              groupName
            );
          }}
        />
      )}
      {modalData.bundleOperator && (
        <AttributeRow
          disabled={
            disabledAllAttributes ||
            disabledAttributes.includes("bundleOperator")
          }
          value={modalData.bundleOperator}
          items={operatorDict}
          label="Logical Operator"
          attributeName="bundleOperator"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange(
              "bundleOperator",
              newValue as EntityEnums.Operator,
              groupName
            );
          }}
        />
      )}
      {modalData.bundleStart && (
        <CheckboxRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("bundleStart")
          }
          value={modalData.bundleStart ? modalData.bundleStart : false}
          label="Bundle start"
          attributeName="bundleStart"
          onChangeFn={(newValue: boolean) => {
            handleDataChange("bundleStart", newValue as boolean, groupName);
          }}
        />
      )}
      {modalData.bundleEnd && (
        <CheckboxRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("bundleEnd")
          }
          value={modalData.bundleEnd ? modalData.bundleEnd : false}
          label="Bundle end"
          attributeName="bundleEnd"
          onChangeFn={(newValue: boolean) => {
            handleDataChange("bundleEnd", newValue as boolean, groupName);
          }}
        />
      )}
      {modalData.certainty && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("certainty")
          }
          value={modalData.certainty}
          items={certaintyDict}
          label="Certainty"
          attributeName="certainty"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange(
              "certainty",
              newValue as EntityEnums.Certainty,
              groupName
            );
          }}
        ></AttributeRow>
      )}
    </StyledAttributeTable>
  );
};
