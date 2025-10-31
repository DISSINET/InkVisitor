import { ThemeColor, ThemeFontSize } from "Theme/theme";
import React, { useEffect, useState } from "react";
import { MdCancel } from "react-icons/md";
import {
  Label,
  StyledClearableInputButton,
  StyledInput,
  StyledTextArea,
  StyledWrapper,
} from "./InputStyles";

interface Input {
  label?: string;
  value?: string;
  inverted?: boolean;
  suggester?: boolean;
  type?:
    | "text"
    | "textarea"
    | "select"
    | "password"
    | "datetime-local"
    | "date"
    | "number";

  rows?: number;
  cols?: number;
  width?: number | "full";
  onChangeFn: (value: string) => void;
  onEnterPressFn?: () => void;
  onFocus?: (
    event: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onBlur?: () => void;
  placeholder?: string;
  changeOnType?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  borderColor?: keyof ThemeColor;

  // TextArea props
  noBorder?: boolean;
  fullHeightTextArea?: boolean;
  fontSizeTextArea?: keyof ThemeFontSize;

  autocomplete?: string;
  required?: boolean;
  minWidth?: number;
  fullHeight?: boolean;
  clearable?: boolean;

  // Number props
  min?: number;
  max?: number;
}

export const Input: React.FC<Input> = ({
  label = "",
  inverted = false,
  suggester = false,
  value = "",
  type = "text",
  rows = 3,
  cols = 50,
  width,
  changeOnType = false,
  onEnterPressFn = () => {},
  onChangeFn,
  placeholder,
  autoFocus = false,
  disabled = false,
  noBorder = false,
  borderColor,
  onFocus = () => {},
  onBlur = () => {},

  fullHeightTextArea = false,
  fontSizeTextArea = "xs",

  autocomplete = "",
  required = false,
  minWidth,
  fullHeight = false,
  clearable = false,
  min,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <StyledWrapper
      width={width}
      $fullHeightTextArea={type === "textarea" && fullHeightTextArea}
      $minWidth={minWidth}
      $fullHeight={fullHeight}
    >
      {label && <Label className="label">{label}</Label>}
      {(type === "text" || type === "password") && (
        <div style={{ position: "relative", width: "100%", display: "flex" }}>
          <StyledInput
            disabled={disabled}
            type={type}
            width={width}
            $fullHeight={fullHeight}
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
            onKeyDown={(event: React.KeyboardEvent) => {
              switch (event.key) {
                case "Enter":
                  if (!event.ctrlKey && !event.metaKey) {
                    onEnterPressFn();
                  }
                  return;
                case "ArrowUp":
                  event.preventDefault();
                  return;
                case "ArrowDown":
                  event.preventDefault();
                  return;
              }
            }}
            onFocus={(event: React.FocusEvent<HTMLInputElement>) =>
              onFocus(event)
            }
            onBlur={() => {
              if (displayValue !== value && !changeOnType) {
                onChangeFn(displayValue);
              }
              onBlur();
            }}
            $inverted={inverted}
            $suggester={suggester}
            $borderColor={borderColor}
            $autocomplete={autocomplete}
            required={required}
            $paddingRight={clearable && displayValue.length > 0}
          />

          {displayValue.length > 0 && clearable && (
            <StyledClearableInputButton>
              <MdCancel
                size={16}
                onClick={() => {
                  setDisplayValue("");
                  onChangeFn("");
                }}
              />
            </StyledClearableInputButton>
          )}
        </div>
      )}
      {type === "textarea" && (
        <StyledTextArea
          $fullHeightTextArea={fullHeightTextArea}
          disabled={disabled}
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
          onFocus={(event: React.FocusEvent<HTMLTextAreaElement>) =>
            onFocus(event)
          }
          onBlur={() => {
            if (displayValue !== value && !changeOnType) {
              onChangeFn(displayValue);
            }
            onBlur();
          }}
          $inverted={inverted}
          $noBorder={noBorder}
          $suggester={suggester}
          $fontSizeTextArea={fontSizeTextArea}
          $borderColor={borderColor}
        />
      )}
      {(type === "datetime-local" || type === "date") && (
        <StyledInput
          type={type}
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDisplayValue(e.currentTarget.value);
            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          $noBorder={noBorder}
          $borderColor={borderColor}
          onFocus={(event: React.FocusEvent<HTMLInputElement>) =>
            onFocus(event)
          }
          onBlur={() => {
            if (displayValue !== value && !changeOnType) {
              onChangeFn(displayValue);
            }
            onBlur();
          }}
        />
      )}
      {type === "number" && (
        <StyledInput
          type={type}
          min={min}
          max={max}
          value={displayValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setDisplayValue(e.currentTarget.value);

            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          $noBorder={noBorder}
          $borderColor={borderColor}
        />
      )}
    </StyledWrapper>
  );
};
