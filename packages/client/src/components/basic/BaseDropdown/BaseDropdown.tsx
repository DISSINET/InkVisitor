import { FloatingPortal } from "@floating-ui/react";
import { AutoPlacement, BasePlacement, VariationPlacement } from "@popperjs/core";
import { allEntities } from "@inkvisitor/shared/dictionaries/entity";
import { IcoChevronDown, IcoClose } from "Theme/icons";
import { Loader, Tooltip } from "components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyledChevron,
  StyledChipBody,
  StyledChipOverflow,
  StyledChipRemove,
  StyledChipShell,
  StyledClear,
  StyledControl,
  StyledControlIcon,
  StyledDefaultChipLabel,
  StyledDefaultOptionRow,
  StyledDropdownWrap,
  StyledGroupHeading,
  StyledIndicators,
  StyledMenu,
  StyledNoOptions,
  StyledOption,
  StyledPlaceholder,
  StyledSearchInput,
  StyledSingleValue,
  StyledValueArea,
} from "./BaseDropdownStyles";
import { flattenOptions } from "./dropdownLogic";
import { BaseDropdownGroup, BaseDropdownItem, ChangeMeta, OptionRenderState } from "./types";
import { useDropdown } from "./useDropdown";

type Position = AutoPlacement | BasePlacement | VariationPlacement;

interface BaseDropdown<O extends BaseDropdownItem = BaseDropdownItem> {
  // a group renders its label as a heading above its options
  options?: (O | BaseDropdownGroup<O>)[];
  value?: O | O[] | null;
  onChange: (selected: O[], meta: ChangeMeta<O>) => void;
  multi?: boolean;
  searchable?: boolean;
  // appearance
  width?: number | "full";
  placeholder?: string;
  /**
   * What the control is called, where nothing on screen names it.
   *
   * A dropdown whose only text is its current value tells a screen reader the
   * value and nothing about the question - "coordinates", with no way to learn
   * that it arranges a list. Set it wherever the control has no visible label
   * beside it.
   */
  ariaLabel?: string;
  noOptionsMessage?: string;
  icon?: React.ReactNode;
  tooltipLabel?: string;
  // plain-text tooltip for a single-value dropdown, in place of the bold
  // tooltipLabel - for a sentence rather than a name
  tooltipContent?: string;
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
  onMenuOpenChange?: (isOpen: boolean) => void;
  // customization
  renderOption?: (option: O, state: OptionRenderState) => React.ReactNode;
  renderValue?: (option: O) => React.ReactNode;
  // `remove` is the chip's cross (null while disabled); the body places it
  // inside its own border
  renderChip?: (option: O, remove: React.ReactNode) => React.ReactNode;
  chipLimit?: number;
  chipSummary?: (count: number, total: number) => React.ReactNode;
  hiddenChipValues?: string[];
  chipDensity?: "default" | "compact";
}

export const BaseDropdown = <O extends BaseDropdownItem = BaseDropdownItem>({
  options = [],
  value,
  onChange,
  multi = false,
  searchable = true,
  width,
  placeholder = "Select",
  ariaLabel,
  noOptionsMessage = "No option selected",
  icon,
  tooltipLabel,
  tooltipContent,
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
  onMenuOpenChange,
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

  const { items, groupOf } = useMemo(() => flattenOptions(options), [options]);

  const dd = useDropdown<O>({
    options: items,
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

  // the cleanup also runs on unmount, so a dropdown removed with its menu open
  // still reports it closed
  const onMenuOpenChangeRef = useRef(onMenuOpenChange);
  onMenuOpenChangeRef.current = onMenuOpenChange;
  useEffect(() => {
    if (!dd.open) return;
    onMenuOpenChangeRef.current?.(true);
    return () => onMenuOpenChangeRef.current?.(false);
  }, [dd.open]);

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

  const renderRemove = (option: O) =>
    disabled ? null : (
      <StyledChipRemove
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          dd.removeChip(option);
        }}
      >
        <IcoClose size={14} />
      </StyledChipRemove>
    );

  return (
    <StyledDropdownWrap
      // lets global key handlers tell a dropdown's focused control apart from other inputs
      data-dropdown
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
        aria-label={ariaLabel}
        tabIndex={!disabled && !searchable ? 0 : -1}
        // floating-ui returns its own onFocus/onBlur, so ours go through
        // getReferenceProps to be merged rather than overwritten by the spread
        {...dd.getReferenceProps({
          onFocus: handleFocus,
          onBlur: handleBlur,
          onKeyDown: dd.onControlKeyDown,
          onClick: () => {
            if (!disabled) {
              inputRef.current?.focus();
            }
          },
        })}
      >
        {icon && <StyledControlIcon>{icon}</StyledControlIcon>}

        <StyledValueArea
          $density={chipDensity}
          $suggester={suggester}
          $single={!multi}
          // a limited row of default chips stays one line, its chips shrinking
          // to fit; compact chips may wrap onto further rows
          $nowrap={chipLimit != null && chipDensity === "default"}
        >
          {/* multi: chips or the collapsed summary */}
          {multi &&
            (collapse ? (
              <StyledChipShell $density={chipDensity}>
                <StyledChipBody>
                  <StyledDefaultChipLabel>
                    {chipSummary!(selectedArray.length, items.length)}
                  </StyledDefaultChipLabel>
                  {renderRemove(selectedArray[selectedArray.length - 1])}
                </StyledChipBody>
              </StyledChipShell>
            ) : (
              <>
                {visibleChips.map((o) => (
                  <StyledChipShell key={`${o.label}-${o.value}`} $density={chipDensity}>
                    {renderChip ? (
                      renderChip(o, renderRemove(o))
                    ) : (
                      <StyledChipBody>
                        <StyledDefaultChipLabel>{o.label}</StyledDefaultChipLabel>
                        {renderRemove(o)}
                      </StyledChipBody>
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
              aria-label={ariaLabel}
              $chars={dd.search ? dd.search.length + 1 : showPlaceholder ? placeholder.length : 0}
              $suggester={suggester}
              $fill={showPlaceholder}
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
          {chevron && (
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
              const group = groupOf.get(option);
              const startsGroup =
                group !== undefined && (i === 0 || groupOf.get(dd.filtered[i - 1]) !== group);
              return (
                <React.Fragment key={`${option.label}-${option.value}`}>
                  {startsGroup && <StyledGroupHeading>{group}</StyledGroupHeading>}
                  <StyledOption
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
                          option.menuLabel ?? option.label
                        )}
                      </StyledDefaultOptionRow>
                    )}
                  </StyledOption>
                </React.Fragment>
              );
            })}
          </StyledMenu>
        </FloatingPortal>
      )}

      {/* control tooltip — unchanged behavior from the old implementation */}
      {(tooltipLabel || tooltipContent) && (
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
              ) : tooltipContent ? (
                tooltipContent
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
