import { FloatingPortal } from "@floating-ui/react";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";
import { allEntities } from "@inkvisitor/shared/dictionaries/entity";
import { DropdownItem } from "@inkvisitor/shared/types";
import { IcoChevronDown, IcoClose } from "Theme/icons";
import { Loader, Tooltip } from "components";
import React, { useEffect, useRef, useState } from "react";
import {
  StyledChevron,
  StyledChipOverflow,
  StyledChipRemove,
  StyledChipShell,
  StyledClear,
  StyledControl,
  StyledControlIcon,
  StyledDefaultChipBody,
  StyledDefaultOptionRow,
  StyledDropdownWrap,
  StyledIndicators,
  StyledMenu,
  StyledNoOptions,
  StyledOption,
  StyledPlaceholder,
  StyledSearchInput,
  StyledSingleValue,
  StyledValueArea,
} from "./BaseDropdownStyles";
import { ChangeMeta, OptionRenderState } from "./types";
import { useDropdown } from "./useDropdown";

type Position = AutoPlacement | BasePlacement | VariationPlacement;

interface BaseDropdown<O extends DropdownItem = DropdownItem> {
  options?: O[];
  value?: O | O[] | null;
  onChange: (selected: O[], meta: ChangeMeta<O>) => void;
  multi?: boolean;
  searchable?: boolean;
  // appearance
  width?: number | "full";
  placeholder?: string;
  noOptionsMessage?: string;
  icon?: React.ReactNode;
  tooltipLabel?: string;
  tooltipPosition?: Position;
  suggester?: boolean;
  disabled?: boolean;
  disabledAppearance?: "stripes" | "quiet";
  chevron?: boolean;
  clearable?: boolean;
  loading?: boolean;
  closeMenuOnSelect?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  // customization
  renderOption?: (option: O, state: OptionRenderState) => React.ReactNode;
  renderValue?: (option: O) => React.ReactNode;
  renderChip?: (option: O) => React.ReactNode;
  chipLimit?: number;
  chipSummary?: (count: number, total: number) => React.ReactNode;
  hiddenChipValues?: string[];
  chipDensity?: "default" | "compact";
}

export const BaseDropdown = <O extends DropdownItem = DropdownItem>({
  options = [],
  value,
  onChange,
  multi = false,
  searchable = true,
  width,
  placeholder = "Select",
  noOptionsMessage = "No option selected",
  icon,
  tooltipLabel,
  tooltipPosition = "top",
  suggester = false,
  disabled = false,
  disabledAppearance = "stripes",
  chevron = true,
  clearable = false,
  loading = false,
  closeMenuOnSelect = true,
  autoFocus = false,
  onFocus = () => {},
  onBlur = () => {},
  renderOption,
  renderValue,
  renderChip,
  chipLimit,
  chipSummary,
  hiddenChipValues = [],
  chipDensity = "default",
}: BaseDropdown<O>) => {
  const selectedArray: O[] =
    value == null ? [] : Array.isArray(value) ? value : [value];

  const dd = useDropdown<O>({
    options,
    value: selectedArray,
    multi,
    searchable: searchable && !disabled,
    disabled,
    closeMenuOnSelect,
    onChange,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [wrapperEl, setWrapperEl] = useState<HTMLDivElement | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      (inputRef.current ?? (dd.refs.domReference.current as HTMLElement | null))?.focus();
    }
  }, [autoFocus]);

  /* fire onFocus/onBlur only when focus enters/leaves the whole control —
     3 call sites lazy-load their options in onFocus */
  const handleFocus = (e: React.FocusEvent) => {
    if (!(e.relatedTarget && e.currentTarget.contains(e.relatedTarget))) {
      onFocus();
    }
  };
  const handleBlur = (e: React.FocusEvent) => {
    const next = e.relatedTarget;
    if (next && e.currentTarget.contains(next)) return;
    if (next && dd.refs.floating.current?.contains(next)) return;
    onBlur();
  };

  // chips visible in the control (multi): hidden values (ANY) never render
  const chips = selectedArray.filter(
    (o) => !hiddenChipValues.includes(o.value)
  );
  const visibleChips = chipLimit != null ? chips.slice(0, chipLimit) : chips;
  const overflowCount = chips.length - visibleChips.length;
  const collapse = multi && chipSummary && selectedArray.length > 1;

  const showPlaceholder = selectedArray.length === 0 && !dd.search;
  const singleValue = !multi && selectedArray.length > 0 ? selectedArray[0] : undefined;

  return (
    <StyledDropdownWrap
      $width={width}
      ref={setWrapperEl}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip(false);
      }}
    >
      <StyledControl
        ref={dd.refs.setReference}
        $focused={dd.open}
        $disabled={disabled}
        $disabledAppearance={disabledAppearance}
        $suggester={suggester}
        tabIndex={!disabled && !searchable ? 0 : -1}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...dd.getReferenceProps({
          onKeyDown: dd.onControlKeyDown,
          onClick: () => {
            if (!disabled) {
              inputRef.current?.focus();
            }
          },
        })}
      >
        {icon && <StyledControlIcon>{icon}</StyledControlIcon>}

        <StyledValueArea $density={chipDensity} $suggester={suggester}>
          {/* multi: chips or the collapsed summary */}
          {multi &&
            (collapse ? (
              <StyledChipShell>
                <StyledDefaultChipBody>
                  {chipSummary!(selectedArray.length, options.length)}
                </StyledDefaultChipBody>
                {!disabled && (
                  <StyledChipRemove
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      dd.removeChip(selectedArray[selectedArray.length - 1]);
                    }}
                  >
                    <IcoClose size={12} />
                  </StyledChipRemove>
                )}
              </StyledChipShell>
            ) : (
              <>
                {visibleChips.map((o) => (
                  <StyledChipShell key={`${o.label}-${o.value}`}>
                    {renderChip ? (
                      renderChip(o)
                    ) : (
                      <StyledDefaultChipBody>{o.label}</StyledDefaultChipBody>
                    )}
                    {!disabled && (
                      <StyledChipRemove
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          dd.removeChip(o);
                        }}
                      >
                        <IcoClose size={12} />
                      </StyledChipRemove>
                    )}
                  </StyledChipShell>
                ))}
                {overflowCount > 0 && (
                  <StyledChipOverflow>+{overflowCount} more</StyledChipOverflow>
                )}
              </>
            ))}

          {/* single: current value (hidden while typing a filter) */}
          {singleValue && !dd.search && (
            <StyledSingleValue $suggester={suggester}>
              {renderValue ? renderValue(singleValue) : singleValue.label}
            </StyledSingleValue>
          )}

          {showPlaceholder && (!searchable || disabled) && (
            <StyledPlaceholder>{placeholder}</StyledPlaceholder>
          )}

          {searchable && !disabled && (
            <StyledSearchInput
              ref={inputRef}
              $chars={dd.search ? dd.search.length + 1 : showPlaceholder ? placeholder.length : 0}
              $suggester={suggester}
              value={dd.search}
              placeholder={showPlaceholder ? placeholder : ""}
              onChange={(e) => {
                dd.setSearch(e.target.value);
                if (!dd.open) {
                  dd.setOpen(true);
                }
              }}
            />
          )}
        </StyledValueArea>

        <StyledIndicators>
          {clearable && !disabled && selectedArray.length > 0 && (
            <StyledClear
              onClick={(e) => {
                e.stopPropagation();
                dd.clear();
              }}
            >
              <IcoClose size={14} />
            </StyledClear>
          )}
          {loading && <Loader show size={7} loaderStyle="beat" />}
          {chevron && !disabled && (
            <StyledChevron $suggester={suggester}>
              <IcoChevronDown size={9} />
            </StyledChevron>
          )}
        </StyledIndicators>
      </StyledControl>

      {dd.open && (
        <FloatingPortal id="page-content">
          <StyledMenu
            ref={dd.refs.setFloating}
            style={dd.floatingStyles}
            {...dd.getFloatingProps({
              // ancestor popovers dismiss on pointerdown; stop both phases so
              // clicking menu options doesn't collapse a popover hosting this dropdown
              onPointerDown: (e) => e.stopPropagation(),
              onMouseDown: (e) => e.stopPropagation(),
            })}
          >
            {dd.filtered.length === 0 && (
              <StyledNoOptions>{noOptionsMessage}</StyledNoOptions>
            )}
            {dd.filtered.map((option, i) => {
              const state: OptionRenderState = {
                selected: dd.isSelected(option),
                highlighted: dd.activeIndex === i,
                disabled: !!option.isDisabled,
              };
              return (
                <StyledOption
                  key={`${option.label}-${option.value}`}
                  ref={(el) => {
                    dd.itemsRef.current[i] = el;
                  }}
                  $highlighted={state.highlighted}
                  $selected={state.selected}
                  $disabled={state.disabled}
                  {...dd.getItemProps({
                    // active/selected keys drive floating-ui's
                    // aria-activedescendant wiring — do not drop them
                    active: state.highlighted,
                    selected: state.selected,
                    onClick: () => dd.selectOption(option),
                  })}
                >
                  {renderOption ? (
                    renderOption(option, state)
                  ) : (
                    <StyledDefaultOptionRow>
                      {option.value === allEntities.value ? (
                        <i>{option.label}</i>
                      ) : (
                        option.label
                      )}
                    </StyledDefaultOptionRow>
                  )}
                </StyledOption>
              );
            })}
          </StyledMenu>
        </FloatingPortal>
      )}

      {/* control tooltip — unchanged behavior from the old implementation */}
      {tooltipLabel && (
        <Tooltip
          disabled={multi && selectedArray.length === 0}
          content={
            <p>
              {multi ? (
                <>
                  <b>
                    {selectedArray.map((v, key) => (
                      <React.Fragment key={key}>
                        {v.value !== allEntities.value && (
                          <>
                            {v.label}
                            {key !== selectedArray.length - 1 && ", "}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </b>{" "}
                  ({tooltipLabel})
                </>
              ) : (
                <b>{tooltipLabel}</b>
              )}
            </p>
          }
          visible={showTooltip}
          referenceElement={wrapperEl}
          position={tooltipPosition}
        />
      )}
    </StyledDropdownWrap>
  );
};
