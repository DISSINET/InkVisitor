import React, { useEffect, useState } from "react";

import { Button, Input } from "components";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { StyledRow } from "./MultiInputStyles";

interface MultiInput {
  values: string[];
  onChange: Function;
}
export const MultiInput: React.FC<MultiInput> = ({ values, onChange }) => {
  const [displayValues, setDisplayValues] = useState(values);
  useEffect(() => {
    const newDisplayValues = values.map((v) => v || "");
    setDisplayValues(newDisplayValues);
  }, [values]);

  const sendChanges = (newValues: string[]) => {
    onChange(newValues);
  };

  const handleChange = (key: number, value: string) => {
    const newValues = [...displayValues];
    newValues[key] = value;
    setDisplayValues(newValues);
    sendChanges(newValues);
  };
  const handleDelete = (key: number) => {
    const newValues = [...displayValues];
    newValues.splice(key, 1);
    setDisplayValues(newValues);
    sendChanges(newValues);
  };
  const handleAdd = () => {
    const newValues = [...displayValues];
    newValues.push("");
    setDisplayValues(newValues);
    sendChanges(newValues);
  };

  return (
    <>
      {displayValues?.map((value, key) => {
        return (
          <StyledRow key={key}>
            <Input
              key={key}
              type="textarea"
              width={1000}
              onChangeFn={(newValue: string) => {
                handleChange(key, newValue);
              }}
              value={value}
            />
            <div style={{ display: "flex" }}>
              <Button
                color="danger"
                icon={<FaTrashAlt />}
                onClick={() => handleDelete(key)}
              />
            </div>
          </StyledRow>
        );
      })}
      <Button
        icon={<FaPlus />}
        label={"New note"}
        onClick={() => handleAdd()}
      />
    </>
  );
};
