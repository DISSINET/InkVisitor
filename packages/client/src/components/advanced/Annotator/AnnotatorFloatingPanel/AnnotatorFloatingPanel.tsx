import {
  autoUpdate,
  flip,
  FloatingPortal,
  limitShift,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import { Button } from "components";
import useKeypress from "hooks/useKeyPress";
import React, { ReactNode, useLayoutEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import { MdDragIndicator } from "react-icons/md";
import { ANNOTATOR_MENU_PAGE_PADDING, useAnnotatorMenuDrag } from "../hooks/useAnnotatorMenuDrag";
import {
  StyledFloatingPanelBody,
  StyledFloatingPanelDraggable,
  StyledFloatingPanelHeader,
  StyledFloatingPanelRoot,
  StyledFloatingPanelTitle,
} from "./AnnotatorFloatingPanelStyles";

interface AnnotatorFloatingPanel {
  title: string;
  onClose: () => void;
  closeTooltipLabel: string;
  /** Rendered left of the title, inside the drag handle — e.g. a back arrow. */
  titlePrefix?: ReactNode;
  children: ReactNode;
}

export const AnnotatorFloatingPanel: React.FC<AnnotatorFloatingPanel> = ({
  title,
  onClose,
  closeTooltipLabel,
  titlePrefix,
  children,
}) => {
  const { dragHandleProps, draggableRef, dragOffset } = useAnnotatorMenuDrag();

  // Opens centered over the page, like the annotator selection menu — the user
  // drags it out of the way from there.
  const middleware = useMemo(() => {
    if (typeof document === "undefined") return [];
    const page = document.getElementById("page");
    const centerOnPoint = offset(({ rects }) => ({
      mainAxis: -(rects.floating.height || 0) / 2,
    }));
    if (!page) return [centerOnPoint];
    return [
      centerOnPoint,
      flip({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
      }),
      shift({
        boundary: page,
        padding: ANNOTATOR_MENU_PAGE_PADDING,
        crossAxis: true,
        limiter: limitShift(),
      }),
    ];
  }, []);

  const { refs, floatingStyles } = useFloating({
    open: true,
    placement: "bottom",
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware,
  });

  useLayoutEffect(() => {
    const page = document.getElementById("page");
    if (!page) return;
    refs.setPositionReference({
      getBoundingClientRect() {
        const r = page.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        return new DOMRect(cx, cy, 0, 0);
      },
      contextElement: page,
    });
  }, []);

  useKeypress("Escape", onClose);

  return (
    <FloatingPortal id="page">
      <StyledFloatingPanelRoot
        ref={(node) => {
          refs.setFloating(node);
        }}
        style={floatingStyles}
      >
        <StyledFloatingPanelDraggable
          ref={draggableRef}
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          }}
        >
          <StyledFloatingPanelHeader>
            {/* Drag lives on the title only — the handle's onPointerDown
                preventDefault()s, which would swallow clicks on the close
                button if it sat inside the draggable area. */}
            <StyledFloatingPanelTitle {...dragHandleProps}>
              {titlePrefix ?? <MdDragIndicator size={16} />}
              {title}
            </StyledFloatingPanelTitle>
            <Button
              icon={<FaTimes size={12} />}
              color="primary"
              inverted
              noBorder
              noBackground
              onClick={onClose}
              tooltipLabel={closeTooltipLabel}
            />
          </StyledFloatingPanelHeader>

          <StyledFloatingPanelBody>{children}</StyledFloatingPanelBody>
        </StyledFloatingPanelDraggable>
      </StyledFloatingPanelRoot>
    </FloatingPortal>
  );
};
