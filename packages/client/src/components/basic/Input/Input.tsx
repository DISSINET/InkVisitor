import theme, { ThemeColor, ThemeFontSize } from "Theme/theme";
import React, { useEffect, useRef, useState } from "react";
import { MdCancel, MdCheck, MdClose } from "react-icons/md";
import {
  Label,
  StyledClearableInputButton,
  StyledInput,
  StyledTextArea,
  StyledWrapper,
  StyledActionButtonGroup,
  StyledActionButton,
  StyledIconWrapper,
  StyledRightContent,
} from "./InputStyles";
import { IconWithTooltip, Tooltip } from "components";
import { DatePicker } from "../DatePicker/DatePicker";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";

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
  // reserve right padding inside the textarea (e.g. for an overlaid action button)
  textareaRightPadding?: number;

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

  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  tooltipLabel?: string;
  tooltipPosition?: AutoPlacement | BasePlacement | VariationPlacement;
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
  roundCorners = true,
  textareaRightPadding,

  autocomplete = "",
  required = false,
  minWidth,
  fullHeight = false,
  clearable = false,
  showSaveExitIcons = false,
  min,
  max,
  inputRef,
  icon,
  rightContent,
  tooltipLabel,
  tooltipPosition = "top",
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Measure rightContent so the input reserves matching right padding (its width
  // is dynamic, e.g. a variable number of icon checkboxes) and the clearable
  // button can be offset to sit left of it.
  const internalInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? internalInputRef;
  const rightContentRef = useRef<HTMLDivElement>(null);
  const [rightContentWidth, setRightContentWidth] = useState(0);
  useEffect(() => {
    if (!rightContentRef.current) {
      setRightContentWidth(0);
      return;
    }
    const el = rightContentRef.current;
    const observer = new ResizeObserver(() => {
      setRightContentWidth(el.offsetWidth);
    });
    observer.observe(el);
    setRightContentWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, [rightContent]);

  const [tooltipReferenceEl, setTooltipReferenceEl] = useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

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
        <div
          ref={setTooltipReferenceEl}
          style={{ position: "relative", width: "100%", display: "flex" }}
          onMouseEnter={() => tooltipLabel && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <StyledInput
            $roundCorners={roundCorners}
            ref={resolvedInputRef}
            disabled={disabled}
            type={type}
            width={width}
            $fullHeight={fullHeight}
            autoFocus={autoFocus}
            className="value"
            placeholder={placeholder}
            value={displayValue}
            $icon={icon}
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
            onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
              setShowTooltip(false);
              onFocus(event);
            }}
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
            $rightPadding={
              rightContentWidth
                ? rightContentWidth + 2 + (clearable && displayValue.length > 0 ? 18 : 0)
                : undefined
            }
          />

          {icon && <StyledIconWrapper>{icon}</StyledIconWrapper>}

          {rightContent && (
            <StyledRightContent
              ref={rightContentRef}
              $showDivider={clearable && displayValue.length > 0}
            >
              {rightContent}
            </StyledRightContent>
          )}

          {displayValue.length > 0 && clearable && (
            <StyledClearableInputButton $rightOffset={rightContentWidth}>
              <MdCancel
                size={15}
                onClick={() => {
                  setDisplayValue("");
                  onChangeFn("");
                  resolvedInputRef.current?.focus();
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

          {tooltipLabel && (
            <Tooltip
              label={tooltipLabel}
              visible={showTooltip}
              referenceElement={tooltipReferenceEl}
              position={tooltipPosition}
            />
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
          $roundCorners={roundCorners}
          $rightPadding={textareaRightPadding}
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
