import { Button } from "components";
import update from "immutability-helper";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IcoPlusBold } from "Theme/icons";
import { ButtonSize } from "types";
import { MultiInputRow } from "./MultiInputRow";

interface MultiInput {
  values: string[];
  onChange: (values: string[]) => void;
  width?: number | "full";
  disabled?: boolean;
}
export const MultiInput: React.FC<MultiInput> = ({ values, onChange, width, disabled = true }) => {
  const [displayValues, setDisplayValues] = useState(values);
  useEffect(() => {
    const newDisplayValues = values.map((v) => v || "");
    setDisplayValues(newDisplayValues);
  }, [values]);

  // the drop handler fires outside of React's render, so the order it needs to
  // persist is read from a ref rather than from the state closure
  const displayValuesRef = useRef(displayValues);
  useEffect(() => {
    displayValuesRef.current = displayValues;
  }, [displayValues]);

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

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setDisplayValues((prevValues) =>
      update(prevValues, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevValues[dragIndex]],
        ],
      }),
    );
  }, []);

  return (
    <>
      {displayValues?.map((value, key) => {
        return (
          <MultiInputRow
            key={key}
            index={key}
            value={value}
            width={width}
            disabled={disabled}
            hasOrder={displayValues.length > 1}
            onChange={(newValue: string) => handleChange(key, newValue)}
            onDelete={() => handleDelete(key)}
            moveRow={moveRow}
            updateOrderFn={() => onChange(displayValuesRef.current)}
          />
        );
      })}

      {!disabled && (
        <div style={{ paddingTop: displayValues.length > 0 ? "0.5rem" : "" }}>
          <Button
            icon={<IcoPlusBold />}
            label={"new note"}
            color="primary"
            inverted
            size={ButtonSize.Medium}
            onClick={() => handleAdd()}
          />
        </div>
      )}
    </>
  );
};
