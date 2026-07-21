import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { IEntity, IResponseTerritory } from "@inkvisitor/shared/types";
import React, { useState } from "react";
import { AnnotatorStatementTargetPicker } from "../AnnotatorMenu/AnnotatorStatementTargetPicker";
import { StyledStatementTargetPopover } from "../styles";
import { AnnotatorPositionTNode } from "../types";

interface UseAnnotatorTargetPicker {
  hierarchy: AnnotatorPositionTNode[];
  activeTerritoryId?: string;
  activeTInHierarchy: boolean;
  entities: Record<string, IEntity | false>;
  territory?: IResponseTerritory;
  value?: string;
  onChange: (id: string) => void;
  title?: string;
}

/**
 * Floating popover wiring for an Annotator target-Territory picker. Returns the
 * props to spread on the caret reference element, a toggle, and the rendered
 * popover. Shared by the Statement and Territory subsections so both can drive
 * the same selected target while keeping their own anchor and open state.
 */
export const useAnnotatorTargetPicker = ({
  hierarchy,
  activeTerritoryId,
  activeTInHierarchy,
  entities,
  territory,
  value,
  onChange,
  title,
}: UseAnnotatorTargetPicker) => {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 4 })],
  });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const referenceProps = {
    ref: refs.setReference,
    ...getReferenceProps(),
  };

  const popover = open ? (
    <FloatingPortal>
      <StyledStatementTargetPopover
        ref={refs.setFloating}
        style={floatingStyles}
        {...getFloatingProps()}
      >
        <AnnotatorStatementTargetPicker
          hierarchy={hierarchy}
          activeTerritoryId={activeTerritoryId}
          activeTInHierarchy={activeTInHierarchy}
          entities={entities}
          territory={territory}
          value={value}
          title={title}
          onChange={(id) => {
            onChange(id);
            setOpen(false);
          }}
        />
      </StyledStatementTargetPopover>
    </FloatingPortal>
  ) : null;

  return {
    open,
    setOpen,
    toggle: () => setOpen((isOpen) => !isOpen),
    referenceProps,
    popover,
  };
};
