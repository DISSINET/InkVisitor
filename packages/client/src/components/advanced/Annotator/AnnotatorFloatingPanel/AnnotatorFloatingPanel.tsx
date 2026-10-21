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
import { useKeyLayer } from "components/basic/Modal/layerStack";
import React, { ReactNode, useLayoutEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import { MdChevronLeft, MdDragIndicator } from "react-icons/md";
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
  /** When given, a back button sits beside close and returns to the prior step. */
  onBack?: () => void;
  backTooltipLabel?: string;
  children: ReactNode;
}

export const AnnotatorFloatingPanel: React.FC<AnnotatorFloatingPanel> = ({
  title,
  onClose,
  closeTooltipLabel,
  onBack,
  backTooltipLabel,
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

  // A layer of its own, so Escape and Ctrl+Enter from the canvas stop here and
  // do not reach the modal the annotator sits in (the Documents page).
  useKeyLayer(true, { onEscape: onClose });

  return (
    <FloatingPortal id="page">
      <StyledFloatingPanelRoot
        ref={(node) => {
          refs.setFloating(node);
        }}
        style={floatingStyles}
        // Keys typed in the panel are handled here; past it, closing the panel
        // takes it off the layer stack and the key would fall to the modal below.
        // Modals opened from the panel (entity create) are portaled elsewhere in
        // the DOM but still bubble through here, so they are left alone.
        onKeyDown={(e) => {
          if (!e.currentTarget.contains(e.target as Node)) {
            return;
          }
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.stopPropagation();
          }
        }}
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
              <MdDragIndicator size={16} />
              {title}
            </StyledFloatingPanelTitle>
            {onBack && (
              <Button
                icon={<MdChevronLeft size={16} />}
                color="primary"
                inverted
                noBorder
                noBackground
                onClick={onBack}
                tooltipLabel={backTooltipLabel}
              />
            )}
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
