import React from "react";
import classNames from "classnames";

import { OptionI } from "@shared/types";

interface InputProps {
  label?: string;
  value?: string;
  inverted?: Boolean;
  type?: "text" | "textarea" | "select";
  options?: OptionI[];
  rows?: number;
  cols?: number;
  onChangeFn: Function;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  inverted,
  value,
  type,
  options,
  rows,
  cols,
  onChangeFn,
  placeholder,
}) => {
  const labelClasses = classNames(
    "label",
    "text-right",
    "text-s",
    "mr-2",
    "font-bold",
    "align-top",
    "leading-10"
  );
  const valueClasses = classNames(
    "value",
    "border-2",
    "border-primary",
    "text-left",
    "text-xs",
    "p-1",
    "resize-none",
    {
      "bg-primary": inverted,
      "text-white": inverted,
    }
  );

  return (
    <div className="wrapper mt-2">
      {label && <span className={labelClasses}> {label}</span>}
      {type === "text" && (
        <input
          className={valueClasses}
          style={{ lineHeight: "19px" }}
          placeholder={placeholder}
          defaultValue={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChangeFn(e.currentTarget.value);
          }}
        />
      )}
      {type === "textarea" && (
        <textarea
          className={valueClasses}
          placeholder={placeholder}
          defaultValue={value}
          rows={rows}
          cols={cols}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChangeFn(e.target.value);
          }}
        />
      )}
      {type === "select" && options && (
        <select
          className={valueClasses + " font-bold"}
          defaultValue={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            onChangeFn(e.target.value);
          }}
        >
          {options.map((option, oi) => (
            <option key={oi} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

Input.defaultProps = {
  inverted: false,
  label: "",
  value: "",
  type: "text",
  options: [],
  rows: 5,
  cols: 50,
};
