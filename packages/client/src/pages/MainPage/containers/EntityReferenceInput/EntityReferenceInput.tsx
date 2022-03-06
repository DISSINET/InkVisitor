import { entityReferenceSourceDict } from "@shared/dictionaries";
import { EntityReferenceSource } from "@shared/enums";
import { IEntityReference, IOption } from "@shared/types";
import { Button, Dropdown, Input } from "components";
import { CEntityReference } from "constructors";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";
import { OptionTypeBase } from "react-select";
import { sources } from "webpack";
import { StyledRow } from "../ActantSearchBox/ActantSearchBoxStyles";

interface EntityReferenceInput {
  values: IEntityReference[];
  onChange: Function;
  disabled?: boolean;
  sources: IOption[];
}

export const EntityReferenceInput: React.FC<EntityReferenceInput> = ({
  values,
  onChange,
  disabled = true,
  sources,
}) => {
  const [displayValues, setDisplayValues] = useState(values);
  useEffect(() => {
    const newDisplayValues = values.map((v) => v || "");
    setDisplayValues(newDisplayValues);
  }, [values]);

  const sendChanges = (newValues: IEntityReference[]) => {
    // if (JSON.stringify(newValues) !== JSON.stringify(displayValues)) {
    onChange(newValues);
    onChange(newValues);
    // }
  };

  const handleChangeSource = (key: number, newSource: OptionTypeBase) => {
    if (newSource) {
      const newValues = [...displayValues];
      newValues[key].source = newSource.value;
      sendChanges(newValues);
    }
  };

  const handleChangeValue = (key: number, newValue: string) => {
    const newValues = [...displayValues];
    newValues[key].value = newValue;
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
    newValues.push(CEntityReference());
    setDisplayValues(newValues);
    sendChanges(newValues);
  };

  return (
    <>
      {displayValues?.map((value, key) => {
        return (
          <StyledRow key={key}>
            <Dropdown
              width={100}
              disabled={disabled}
              isMulti={false}
              onChange={(newSource) => {
                if (newSource) {
                  handleChangeSource(key, newSource);
                }
              }}
              options={sources}
              value={sources.find((ers: IOption) => ers.value === value.source)}
            />
            <Input
              key={key}
              disabled={disabled}
              type="text"
              onChangeFn={(newValue: string) => {
                handleChangeValue(key, newValue);
              }}
              value={value.value}
            />
            <div style={{ display: "flex" }}>
              {!disabled && (
                <Button
                  color="danger"
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
          label={"new reference"}
          onClick={() => handleAdd()}
        />
      )}
    </>
  );
};
