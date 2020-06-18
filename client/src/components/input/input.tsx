import React from "react";
import classNames from "classnames";

interface InputProps {
  label?: string;
  value?: string;
  inverted?: Boolean;
  type?: "text" | "textarea" | "select";
  options?: string[];
  rows?: number;
  cols?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  inverted,
  value,
  type,
  options,
  rows,
  cols,
}) => {
  const labelClasses = classNames(
    "label",
    "text-right",
    "mr-2",
    "align-top",
    "leading-10"
  );
  const valueClasses = classNames(
    "value",
    "border-2",
    "border-primary",
    "text-left",
    "p-2",
    "resize-none",
    {
      "bg-primary": inverted,
      "text-white": inverted,
    }
  );

  return (
    <div className="wrapper">
      <span className={labelClasses}> {label}</span>
      {type === "text" && (
        <input className={valueClasses} defaultValue={value} />
      )}
      {type === "textarea" && (
        <textarea
          className={valueClasses}
          defaultValue={value}
          rows={rows}
          cols={cols}
        />
      )}
      {type === "select" && options && (
        <select className={valueClasses} defaultValue={value}>
          {options.map((option, oi) => (
            <option key={oi}>{option}</option>
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
