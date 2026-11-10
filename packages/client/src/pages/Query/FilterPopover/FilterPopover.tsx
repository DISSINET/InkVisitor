import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  Placement,
  shift,
  size,
  useFloating,
} from "@floating-ui/react";
import { Button, IconButton } from "components";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { IcoClose, IcoFilter } from "Theme/icons";
import { ButtonSize } from "types";
import {
  StyledFilterPopoverBody,
  StyledFilterPopoverClear,
  StyledFilterPopoverContent,
  StyledFilterPopoverHeader,
  StyledFilterPopoverPanel,
  StyledFilterPopoverTitle,
  StyledFilterPopoverTrigger,
} from "./FilterPopoverStyles";

// space kept between the panel and the window edges
const CLIPPING_INSET = 8;

interface FilterPopover {
  /** button text; the count of applied filters is appended to it */
  label: string;
  /** panel heading */
  title: string;
  count: number;
  tooltipLabel?: string;
  /** shows a "clear all" control beside the button and in the panel header while `count` is above zero */
  onClear?: () => void;
  placement?: Placement;
  width?: string;
  buttonSize?: ButtonSize;
  /** renders the control that opens the panel in place of the filter button and its clear icon */
  trigger?: (toggle: () => void) => ReactNode;
  children: ReactNode;
}

/**
 * A filter button with its panel attached. The panel closes on the button, its
 * close icon, Escape or a click outside; closing never drops the filters.
 *
 * It is not a key layer (see layerStack): Enter inside the panel must still run
 * the search, and the page shortcut stays silent while any layer is open.
 */
export const FilterPopover: React.FC<FilterPopover> = ({
  label,
  title,
  count,
  tooltipLabel,
  onClear,
  placement = "bottom-start",
  width = "30rem",
  buttonSize = ButtonSize.Medium,
  trigger,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: CLIPPING_INSET }),
      shift({ padding: CLIPPING_INSET }),
      size({
        padding: CLIPPING_INSET,
        apply({ availableHeight, elements }) {
          elements.floating.style.maxHeight = `${Math.max(0, availableHeight)}px`;
        },
      }),
    ],
  });

  const closeRef = useRef(() => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    // Dropdown menus, date pickers and tooltips opened from inside the panel
    // live in floating-ui portals of their own, so a click there counts as inside.
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Element;
      const reference = refs.reference.current;
      const inTrigger = reference instanceof Element && reference.contains(target);
      const inPanel = refs.floating.current?.contains(target) ?? false;
      const inOtherFloating = target.closest?.("[data-floating-ui-portal]") !== null;
      if (!inTrigger && !inPanel && !inOtherFloating) {
        closeRef.current();
      }
    };
    // an open dropdown inside the panel takes the Escape for its own menu
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") {
        return;
      }
      const focused = document.activeElement;
      if (focused?.closest("[data-dropdown]")?.querySelector("[aria-expanded='true']")) {
        return;
      }
      closeRef.current();
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, refs.reference, refs.floating]);

  return (
    <>
      <StyledFilterPopoverTrigger ref={refs.setReference} $fluid={!!trigger}>
        {trigger ? (
          trigger(() => setIsOpen((open) => !open))
        ) : (
          <>
            <Button
              size={buttonSize}
              icon={<IcoFilter size={14} />}
              label={count > 0 ? `${label} · ${count}` : label}
              color="primary"
              inverted={count === 0 && !isOpen}
              tooltipLabel={tooltipLabel}
              onClick={() => setIsOpen((open) => !open)}
            />
            {onClear && count > 0 && (
              <IconButton
                size={buttonSize}
                icon={<IcoClose size={14} />}
                color="primary"
                noBorder
                noBackground
                tooltipLabel="clear all"
                onClick={onClear}
              />
            )}
          </>
        )}
      </StyledFilterPopoverTrigger>

      {isOpen && (
        // #page-content clips at its edges, and a panel above a button near
        // the top of it needs the room of the whole #page
        <FloatingPortal id="page">
          <StyledFilterPopoverPanel
            ref={refs.setFloating}
            style={floatingStyles}
            $width={width}
            data-run-on-enter="true"
          >
            <StyledFilterPopoverHeader>
              <StyledFilterPopoverTitle>{title}</StyledFilterPopoverTitle>
              {onClear && count > 0 && (
                <StyledFilterPopoverClear
                  type="button"
                  // keeps focus, and so any half-typed input, where it is
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onClear}
                >
                  clear all
                </StyledFilterPopoverClear>
              )}
              <IconButton
                icon={<IcoClose size={16} />}
                tooltipLabel="close, keep the filters"
                noBorder
                noBackground
                color="black"
                onClick={() => setIsOpen(false)}
              />
            </StyledFilterPopoverHeader>
            <StyledFilterPopoverContent>
              <StyledFilterPopoverBody>{children}</StyledFilterPopoverBody>
            </StyledFilterPopoverContent>
          </StyledFilterPopoverPanel>
        </FloatingPortal>
      )}
    </>
  );
};
