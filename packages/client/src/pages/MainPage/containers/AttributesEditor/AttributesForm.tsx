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
  handleModalDataChange: (
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
  ) => void;
}
export const AttributesForm: React.FC<AttributesForm> = ({
  groupName,
  modalData,
  disabledAttributes = [],
  disabledAllAttributes = false,
  handleModalDataChange,
}) => {
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
            handleModalDataChange("elvl", newValue as Elvl, groupName);
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
            handleModalDataChange("logic", newValue as Logic, groupName);
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
            handleModalDataChange("mood", newValue as Mood[], groupName);
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
            handleModalDataChange(
              "moodvariant",
              newValue as MoodVariant,
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
          multi={false}
          items={virtualityDict}
          label="Virtuality"
          attributeName="virtuality"
          onChangeFn={(newValue: string | string[]) => {
            handleModalDataChange(
              "virtuality",
              newValue as Virtuality,
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
          multi={false}
          items={partitivityDict}
          label="Partitivity"
          attributeName="partitivity"
          onChangeFn={(newValue: string | string[]) => {
            handleModalDataChange(
              "partitivity",
              newValue as Partitivity,
              groupName
            );
          }}
        />
      )}
      {modalData.operator && (
        <AttributeRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("operator")
          }
          value={modalData.operator}
          multi={false}
          items={operatorDict}
          label="Logical Operator"
          attributeName="operator"
          onChangeFn={(newValue: string | string[]) => {
            handleModalDataChange("operator", newValue as Operator, groupName);
          }}
        />
      )}
      {modalData.operator && (
        <CheckboxRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("bundleStart")
          }
          value={modalData.bundleStart ? modalData.bundleStart : false}
          label="Bundle start"
          attributeName="bundleStart"
          onChangeFn={(newValue: boolean) => {
            handleModalDataChange(
              "bundleStart",
              newValue as boolean,
              groupName
            );
          }}
        />
      )}
      {modalData.operator && (
        <CheckboxRow
          disabled={
            disabledAllAttributes || disabledAttributes.includes("bundleEnd")
          }
          value={modalData.bundleEnd ? modalData.bundleEnd : false}
          label="Bundle end"
          attributeName="bundleEnd"
          onChangeFn={(newValue: boolean) => {
            handleModalDataChange("bundleEnd", newValue as boolean, groupName);
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
            handleModalDataChange(
              "certainty",
              newValue as Certainty,
              groupName
            );
          }}
        ></AttributeRow>
      )}
    </div>
  );
};
