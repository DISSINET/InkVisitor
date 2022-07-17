import { Button, Input } from "components";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { StyledRow } from "./MultiInputStyles";

interface MultiInput {
  values: string[];
  onChange: Function;
  width?: number | "full";
  disabled?: boolean;
}
export const MultiInput: React.FC<MultiInput> = ({
  values,
  onChange,
  width,
  disabled = true,
}) => {
  const [displayValues, setDisplayValues] = useState(values);
  useEffect(() => {
    const newDisplayValues = values.map((v) => v || "");
    setDisplayValues(newDisplayValues);
  }, [values]);

  const sendChanges = (newValues: string[]) => {
    if (JSON.stringify(newValues) !== JSON.stringify(displayValues)) {
      onChange(newValues);
    }
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
              disabled={disabled}
              type="textarea"
              onChangeFn={(newValue: string) => {
                handleChange(key, newValue);
              }}
              width={width}
              value={value}
            />
            <div style={{ display: "flex" }}>
              {!disabled && (
                <Button
                  color="danger"
                  inverted
                  icon={<FaTrashAlt />}
                  onClick={() => handleDelete(key)}
                />
              )}
            </div>
          </StyledRow>
        );
      })}
      {!disabled && (
        <Button
          icon={<FaPlus />}
          label={"new note"}
          onClick={() => handleAdd()}
        />
      )}
    </>
  );
};
