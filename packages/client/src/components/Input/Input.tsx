import React, { useState, useEffect } from "react";

import { IOption } from "@shared/types";
import {
  Wrapper,
  Label,
  StyledInput,
  StyledSelect,
  StyledTextArea,
} from "./InputStyles";

interface InputProps {
  label?: string;
  value?: string;
  inverted?: boolean;
  type?: "text" | "textarea" | "select";
  options?: IOption[];
  rows?: number;
  cols?: number;
  width?: number;
  onChangeFn: Function;
  placeholder?: string;
  changeOnType?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label = "",
  inverted = false,
  value = "",
  type = "text",
  options = [],
  rows = 5,
  cols = 50,
  width = 150,
  changeOnType = false,
  onChangeFn,
  placeholder,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <Wrapper>
      {label && <Label className="label"> {label}</Label>}
      {type === "text" && (
        <StyledInput
          width={width}
          className="value"
          style={{ lineHeight: "16px" }}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDisplayValue(e.currentTarget.value);
            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          onBlur={() => {
            onChangeFn(displayValue);
          }}
          inverted={inverted}
        />
      )}
      {type === "textarea" && (
        <StyledTextArea
          className="value"
          placeholder={placeholder}
          value={displayValue}
          rows={rows}
          cols={cols}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setDisplayValue(e.target.value);
          }}
          onBlur={() => {
            onChangeFn(displayValue);
          }}
          inverted={inverted}
        />
      )}
      {type === "select" && options && (
        <StyledSelect
          className="value"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onChangeFn(e.target.value);
          }}
          inverted={inverted}
        >
          {options.map((option, oi) => (
            <option key={oi} value={option.value}>
              {option.label}
            </option>
          ))}
        </StyledSelect>
      )}
    </Wrapper>
  );
};
