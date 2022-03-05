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
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Virtuality,
  Partitivity,
  Operator,
  Certainty,
} from "@shared/enums";
import React from "react";
import { GroupName, AttributeData, AttributeName } from "types";
import { AttributeRow } from "./AttributeRow/AttributeRow";
import { CheckboxRow } from "./CheckboxRow/CheckboxRow";

interface AttributesForm {
  groupName?: GroupName;
  modalData: AttributeData;
  disabledAttributes?: AttributeName[];
  disabledAllAttributes?: boolean;
  setNewModalData: (newModalData: AttributeData, groupName?: GroupName) => void;
}
export const AttributesForm: React.FC<AttributesForm> = ({
  groupName,
  modalData,
  disabledAttributes = [],
  disabledAllAttributes = false,
  setNewModalData,
}) => {
  const handleDataChange = (
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
      | boolean,
    groupName?: GroupName
  ) => {
    const newModalData = { ...modalData };

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
      case "bundleOperator":
        newModalData["bundleOperator"] = newValue as Operator;
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
    setNewModalData(newModalData, groupName);
  };
  return (
    <div>
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
            handleDataChange("elvl", newValue as Elvl, groupName);
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
            handleDataChange("logic", newValue as Logic, groupName);
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
            handleDataChange("mood", newValue as Mood[], groupName);
          }}
        />
      )}
      {modalData.moodvariant && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("moodvariant")
          }
          value={modalData.moodvariant}
          multi={false}
          items={moodVariantsDict}
          label="Mood Variant"
          attributeName="moodvariant"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("moodvariant", newValue as MoodVariant, groupName);
          }}
        />
      )}
      {modalData.virtuality && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("virtuality")
          }
          value={modalData.virtuality}
          multi={false}
          items={virtualityDict}
          label="Virtuality"
          attributeName="virtuality"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("virtuality", newValue as Virtuality, groupName);
          }}
        />
      )}
      {modalData.partitivity && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("partitivity")
          }
          value={modalData.partitivity}
          multi={false}
          items={partitivityDict}
          label="Partitivity"
          attributeName="partitivity"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("partitivity", newValue as Partitivity, groupName);
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
          multi={false}
          items={operatorDict}
          label="Logical Operator"
          attributeName="bundleOperator"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("bundleOperator", newValue as Operator, groupName);
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
          multi={false}
          items={certaintyDict}
          label="Certainty"
          attributeName="certainty"
          onChangeFn={(newValue: string | string[]) => {
            handleDataChange("certainty", newValue as Certainty, groupName);
          }}
        ></AttributeRow>
      )}
    </div>
  );
};
