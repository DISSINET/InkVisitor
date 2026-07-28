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
import { entitiesDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Button } from "components";
import Dropdown from "components/advanced";
import React, { useState } from "react";
import { IcoHighlighter } from "Theme/icons";
import { StyledHighlightPopover, StyledHighlightTrigger } from "./AnnotatorBoxStyles";

interface AnnotatorHighlightPopover {
  hlEntities: EntityEnums.Class[];
  setHlEntities: React.Dispatch<React.SetStateAction<EntityEnums.Class[]>>;
}

/**
 * Toolbar trigger + anchored popover for the highlight-class picker. The
 * toolbar sits at the bottom of the canvas, so the popover opens upward.
 */
export const AnnotatorHighlightPopover: React.FC<AnnotatorHighlightPopover> = ({
  hlEntities,
  setHlEntities,
}) => {
  const [open, setOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 4 })],
  });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  return (
    <>
      <StyledHighlightTrigger ref={refs.setReference} {...getReferenceProps()}>
        <Button
          icon={<IcoHighlighter size={14} />}
          color="info"
          inverted
          onClick={() => setOpen((isOpen) => !isOpen)}
          tooltipLabel="highlight entity classes"
          tooltipPosition="top"
        />
      </StyledHighlightTrigger>

      {open && (
        <FloatingPortal>
          <StyledHighlightPopover
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
          >
            <Dropdown.Multi.Entity
              options={entitiesDict}
              disableEmpty
              isClearable
              closeMenuOnSelect={false}
              onChange={setHlEntities}
              value={hlEntities}
              noOptionsMessage="No entity classes to highlight"
              width={300}
            />
          </StyledHighlightPopover>
        </FloatingPortal>
      )}
    </>
  );
};
