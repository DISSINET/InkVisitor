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
  groupName: GroupName;
  modalData: AttributeData;
  disabledAttributes?: AttributeName[];
  disabledAllAttributes?: boolean;
  handleModalDataChange: (
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
  ) => void;
}
export const AttributesForm: React.FC<AttributesForm> = ({
  groupName,
  modalData,
  disabledAttributes = [],
  disabledAllAttributes = false,
  handleModalDataChange,
}) => {
  // const [modalData, setModalData] = useState<AttributeData>(data);

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
            handleModalDataChange(groupName, "elvl", newValue as Elvl);
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
            handleModalDataChange(groupName, "logic", newValue as Logic);
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
            handleModalDataChange(groupName, "mood", newValue as Mood[]);
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
              groupName,
              "moodvariant",
              newValue as MoodVariant
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
              groupName,
              "virtuality",
              newValue as Virtuality
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
              groupName,
              "partitivity",
              newValue as Partitivity
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
            handleModalDataChange(groupName, "operator", newValue as Operator);
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
              groupName,
              "bundleStart",
              newValue as boolean
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
            handleModalDataChange(groupName, "bundleEnd", newValue as boolean);
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
              groupName,
              "certainty",
              newValue as Certainty
            );
          }}
        ></AttributeRow>
      )}
    </div>
  );
};
