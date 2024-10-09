import { ThemeColor, ThemeFontSize } from "Theme/theme";
import React, { useEffect, useState } from "react";
import {
  Label,
  StyledInput,
  StyledTextArea,
  StyledWrapper,
} from "./InputStyles";

interface Input {
  label?: string;
  value?: string;
  inverted?: boolean;
  suggester?: boolean;
  type?: "text" | "textarea" | "select" | "password";
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
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <StyledWrapper
      width={width}
      $fullHeightTextArea={type === "textarea" && fullHeightTextArea}
    >
      {label && <Label className="label">{label}</Label>}
      {(type === "text" || type === "password") && (
        <StyledInput
          disabled={disabled}
          type={type}
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
          onKeyDown={(event: React.KeyboardEvent) => {
            switch (event.key) {
              case "Enter":
                onEnterPressFn();
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
          borderColor={borderColor}
          $autocomplete={autocomplete}
          required={required}
        />
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
          borderColor={borderColor}
        />
      )}
    </StyledWrapper>
  );
};
