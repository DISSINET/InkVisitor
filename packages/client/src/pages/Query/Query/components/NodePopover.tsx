import { FloatingPortal } from "@floating-ui/react";
import React, { ReactNode, useEffect, useRef, useState } from "react";
import { usePopper } from "react-popper";

import { StyledExpansionPopover } from "./QueryStyles";

interface NodePopover {
  referenceElement: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
}

/** A panel below a badge on a query node; closes on Escape or a click outside both. */
export const NodePopover: React.FC<NodePopover> = ({ referenceElement, onClose, children }) => {
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

  return (
    // #page-content is overflow:hidden and starts below the header, so a panel
    // anchored to a node near the top needs the wider #page root
    <FloatingPortal id="page">
      <StyledExpansionPopover ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        {children}
      </StyledExpansionPopover>
    </FloatingPortal>
  );
};
