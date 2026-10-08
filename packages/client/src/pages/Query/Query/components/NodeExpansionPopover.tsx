import { FloatingPortal } from "@floating-ui/react";
import { IResponseEntityExpansion } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePopper } from "react-popper";

import { buildExpansionSection, ExpansionGroup } from "../nodeExpansion";
import {
  StyledExpansionPopover,
  StyledExpansionPopoverHeader,
  StyledExpansionPopoverMessage,
  StyledExpansionSectionHeading,
  StyledExpansionSectionTags,
} from "./QueryStyles";

interface NodeExpansionPopover {
  referenceElement: HTMLElement | null;
  /** the one group this popover shows; each badge opens its own */
  group: ExpansionGroup;
  data: IResponseEntityExpansion | undefined;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onOpenEntityInDetail?: (entityId: string) => void;
}

export const NodeExpansionPopover: React.FC<NodeExpansionPopover> = ({
  referenceElement,
  group,
  data,
  isLoading,
  isError,
  onClose,
  onOpenEntityInDetail,
}) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom",
    modifiers: [
      { name: "offset", options: { offset: [0, 8] } },
      { name: "flip", options: { fallbackPlacements: ["top", "auto"] } },
    ],
  });

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popperElement?.contains(target) || referenceElement?.contains(target)) {
        return;
      }
      onCloseRef.current();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [popperElement, referenceElement]);

  const section = useMemo(() => buildExpansionSection(data, group), [data, group]);

  return (
    // #page-content is overflow:hidden and starts below the header, so a panel
    // anchored to a node near the top needs the wider #page root
    <FloatingPortal id="page">
      <StyledExpansionPopover
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        <StyledExpansionPopoverHeader />
        {isLoading && (
          <StyledExpansionPopoverMessage>loading…</StyledExpansionPopoverMessage>
        )}
        {isError && (
          <StyledExpansionPopoverMessage>
            could not load the expansion
          </StyledExpansionPopoverMessage>
        )}
        {!isLoading && !isError && section && (
          <div>
            <StyledExpansionSectionHeading $variant={section.variant}>
              {section.heading}
            </StyledExpansionSectionHeading>
            <StyledExpansionSectionTags>
              {section.entities.map((entity) => (
                <EntityTag
                  key={entity.id}
                  entity={entity}
                  tagMaxWidth={160}
                  disableDrag
                  isEquivalent={section.variant === "equivalent"}
                  isSubordinate={section.variant === "subordinate"}
                  onDoubleClick={() => onOpenEntityInDetail?.(entity.id)}
                />
              ))}
            </StyledExpansionSectionTags>
          </div>
        )}
        {!isLoading && !isError && !section && (
          <StyledExpansionPopoverMessage>
            nothing added by this toggle
          </StyledExpansionPopoverMessage>
        )}
      </StyledExpansionPopover>
    </FloatingPortal>
  );
};
