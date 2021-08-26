import React, { useState, useEffect, Ref } from "react";

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
  noBorder?: boolean;
  type?: "text" | "textarea" | "select";
  options?: IOption[];
  rows?: number;
  cols?: number;
  width?: number;
  onChangeFn: Function;
  onEnterPressFn?: Function;
  placeholder?: string;
  changeOnType?: boolean;
  password?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label = "",
  inverted = false,
  noBorder = false,
  value = "",
  type = "text",
  options = [],
  rows = 5,
  cols = 50,
  width = 150,
  changeOnType = false,
  onEnterPressFn = () => {},
  onChangeFn,
  placeholder,
  password = false,
  autoFocus = false,
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
          type={password ? "password" : "text"}
          width={width}
          autoFocus={autoFocus}
          className="value"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDisplayValue(e.currentTarget.value);
            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          onKeyPress={(event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
              onEnterPressFn();
            }
          }}
          onBlur={() => {
            if (displayValue !== value) {
              onChangeFn(displayValue);
            }
          }}
          inverted={inverted}
          noBorder={noBorder}
        />
      )}
      {type === "textarea" && (
        <StyledTextArea
          className="value"
          placeholder={placeholder}
          value={displayValue}
          autoFocus={autoFocus}
          rows={rows}
          cols={cols}
          width={width}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setDisplayValue(e.target.value);
            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          onBlur={() => {
            if (!changeOnType) {
              onChangeFn(displayValue);
            }
          }}
          onKeyPress={(event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
              onEnterPressFn();
            }
          }}
          inverted={inverted}
          noBorder={noBorder}
        />
      )}
      {type === "select" && options && (
        <StyledSelect
          className="value"
          value={value}
          autoFocus={autoFocus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onChangeFn(e.target.value);
          }}
          onKeyPress={(event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
              onEnterPressFn();
            }
          }}
          inverted={inverted}
          noBorder={noBorder}
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
