import React, { useState, useEffect, Ref } from "react";

import { IOption } from "@shared/types";
import {
  Wrapper,
  Label,
  StyledInput,
  StyledSelect,
  StyledTextArea,
  StyledSelectReadonly,
} from "./InputStyles";

interface InputProps {
  label?: string;
  value?: string;
  inverted?: boolean;
  suggester?: boolean;
  type?: "text" | "textarea" | "select";
  options?: IOption[];
  rows?: number;
  cols?: number;
  width?: number | "full";
  onChangeFn: Function;
  onEnterPressFn?: Function;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  changeOnType?: boolean;
  password?: boolean;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label = "",
  inverted = false,
  suggester = false,
  value = "",
  type = "text",
  options = [],
  rows = 5,
  cols = 50,
  width,
  changeOnType = false,
  onEnterPressFn = () => {},
  onChangeFn,
  placeholder,
  password = false,
  autoFocus = false,
  onFocus = () => {},
  onBlur = () => {},
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
          onFocus={() => onFocus()}
          onBlur={() => {
            if (displayValue !== value && !changeOnType) {
              onChangeFn(displayValue);
            }
            onBlur();
          }}
          inverted={inverted}
          suggester={suggester}
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
          onFocus={() => onFocus()}
          onBlur={() => {
            if (!changeOnType) {
              onChangeFn(displayValue);
            }
            onBlur();
          }}
          onKeyPress={(event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
              onEnterPressFn();
            }
          }}
          inverted={inverted}
          suggester={suggester}
        />
      )}
      {type === "select" && options && (
        <>
          {options.length > 2 ? (
            <StyledSelect
              className="value"
              value={value}
              width={width}
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
              suggester={suggester}
              onFocus={() => onFocus()}
              onBlur={() => onBlur()}
            >
              {options.map((option, oi) => (
                <option key={oi} value={option.value}>
                  {option.label}
                </option>
              ))}
            </StyledSelect>
          ) : (
            <StyledSelectReadonly
              readOnly
              width={suggester ? 36 : width}
              value={displayValue}
              inverted={inverted}
              suggester={suggester}
            />
          )}
        </>
      )}
    </Wrapper>
  );
};
