import theme, { ThemeColor, ThemeFontSize } from "Theme/theme";
import React, { useEffect, useState } from "react";
import { MdCancel, MdCheck, MdClose } from "react-icons/md";
import {
  Label,
  StyledClearableInputButton,
  StyledInput,
  StyledTextArea,
  StyledWrapper,
  StyledActionButtonGroup,
  StyledActionButton,
} from "./InputStyles";
import { IconWithTooltip } from "components";
import { DatePicker } from "../DatePicker/DatePicker";

interface Input {
  label?: string;
  labelSpaceNoWrap?: boolean;
  value?: string;
  inverted?: boolean;
  suggester?: boolean;
  type?: "text" | "textarea" | "select" | "password" | "datetime-local" | "date" | "number";

  rows?: number;
  cols?: number;
  width?: number | "full";
  onChangeFn: (value: string) => void;
  allowCtrlEnter?: boolean;
  onEnterPressFn?: () => void;
  onEscapePressFn?: () => void;
  onFocus?: (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
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
  roundCorners?: boolean;

  autocomplete?: string;
  required?: boolean;
  minWidth?: number;
  fullHeight?: boolean;
  clearable?: boolean;
  showSaveExitIcons?: boolean;

  // Number props
  min?: number;
  max?: number;

  /** Optional ref to focus the underlying input (e.g. for Cmd+F / Ctrl+F) */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Input: React.FC<Input> = ({
  label = "",
  labelSpaceNoWrap = false,
  inverted = false,
  suggester = false,
  value = "",
  type = "text",
  rows = 3,
  cols = 50,
  width,
  changeOnType = false,
  onEnterPressFn = () => {},
  allowCtrlEnter = false,
  onEscapePressFn = () => {},
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
  roundCorners = false,

  autocomplete = "",
  required = false,
  minWidth,
  fullHeight = false,
  clearable = false,
  showSaveExitIcons = false,
  min,
  max,
  inputRef,
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
      {label && (
        <Label className="label" $labelSpaceNoWrap={labelSpaceNoWrap}>
          {label}
        </Label>
      )}
      {(type === "text" || type === "password") && (
        <div style={{ position: "relative", width: "100%", display: "flex" }}>
          <StyledInput
            $roundCorners={roundCorners}
            ref={inputRef}
            disabled={disabled}
            type={type}
            width={width}
            $fullHeight={fullHeight}
            autoFocus={autoFocus}
            className="value"
            placeholder={placeholder}
            value={displayValue}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setDisplayValue(e.currentTarget.value);
              if (changeOnType) {
                onChangeFn(e.currentTarget.value);
              }
            }}
            onKeyDown={(event: React.KeyboardEvent) => {
              switch (event.key) {
                case "Enter":
                  if ((!event.ctrlKey && !event.metaKey) || allowCtrlEnter) {
                    if (displayValue !== value && !changeOnType) {
                      onChangeFn(displayValue);
                    }
                    onEnterPressFn();
                  }
                  return;
                case "Escape":
                  if (!event.ctrlKey && !event.metaKey) {
                    onEscapePressFn();
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
            onFocus={(event: React.FocusEvent<HTMLInputElement>) => onFocus(event)}
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
            $iconCount={clearable && displayValue.length > 0 ? 1 : showSaveExitIcons ? 2 : 0}
          />

          {displayValue.length > 0 && clearable && (
            <StyledClearableInputButton>
              <MdCancel
                size={15}
                onClick={() => {
                  setDisplayValue("");
                  onChangeFn("");
                }}
              />
            </StyledClearableInputButton>
          )}

          {showSaveExitIcons && (
            <StyledActionButtonGroup>
              {onEnterPressFn && (
                <StyledActionButton
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayValue !== value && !changeOnType) {
                      onChangeFn(displayValue);
                    }
                    onEnterPressFn();
                  }}
                >
                  <IconWithTooltip
                    icon={<MdCheck size={15} />}
                    tooltipLabel="Save changes (Enter)"
                  />
                </StyledActionButton>
              )}
              {onEscapePressFn && (
                <StyledActionButton
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEscapePressFn();
                  }}
                >
                  <IconWithTooltip
                    icon={<MdClose size={15} />}
                    tooltipLabel="Cancel changes (Esc)"
                  />
                </StyledActionButton>
              )}
            </StyledActionButtonGroup>
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
          onChange={(e) => {
            setDisplayValue(e.target.value);
            if (changeOnType) {
              onChangeFn(e.currentTarget.value);
            }
          }}
          onFocus={(e) => onFocus(e)}
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
        <DatePicker
          type={type}
          value={displayValue}
          width={width}
          disabled={disabled}
          clearable={clearable}
          inverted={inverted}
          noBorder={noBorder}
          borderColor={borderColor}
          placeholder={placeholder}
          onChange={(newValue) => {
            setDisplayValue(newValue);
            onChangeFn(newValue);
          }}
          onFocus={() => onFocus({} as React.FocusEvent<HTMLInputElement>)}
          onBlur={onBlur}
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
