import React from "react";

import { OptionI } from "@shared/types";
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
  options?: OptionI[];
  rows?: number;
  cols?: number;
  onChangeFn: Function;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({
  label = "",
  inverted = false,
  value = "",
  type = "text",
  options = [],
  rows = 5,
  cols = 50,
  onChangeFn,
  placeholder,
}) => {
  return (
    <Wrapper>
      {label && <Label className="label"> {label}</Label>}
      {type === "text" && (
        <StyledInput
          className="value"
          style={{ lineHeight: "16px" }}
          placeholder={placeholder}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChangeFn(e.currentTarget.value);
          }}
          inverted={inverted}
        />
      )}
      {type === "textarea" && (
        <StyledTextArea
          className="value"
          placeholder={placeholder}
          value={value}
          rows={rows}
          cols={cols}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChangeFn(e.target.value);
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
