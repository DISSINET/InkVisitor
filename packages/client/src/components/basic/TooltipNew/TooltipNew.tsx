import { VirtualElement } from "@popperjs/core";
import React, { useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { useSpring } from "react-spring";
import {
  StyledPopperContainer,
  StyledTooltipContent,
} from "./TooltipNewStyles";

interface TooltipNew {
  text: string;
  visible: boolean;
  referenceElement?: Element | VirtualElement | null;
}
export const TooltipNew: React.FC<TooltipNew> = ({
  text = "tooltip text",
  visible = false,
  referenceElement,
}) => {
  const [popperElement, setPopperElement] =
    useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes, update, state } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: "bottom",
      modifiers: [
        { name: "arrow", options: { element: arrowElement } },
        {
          name: "offset",
          options: {
            offset: [0, 10],
          },
        },
        {
          name: "flip",
          options: {
            fallbackPlacements: ["top", "right", "left", "bottom"],
          },
        },
      ],
    }
  );

  const animatedTooltip = useSpring({
    opacity: visible ? 1 : 0,
    config: { mass: 2, friction: 2, tension: 100, clamp: true },
  });

  // Needed for state update
  useEffect(() => {
    if (!update) {
      return;
    }
    if (visible) {
      update();
    }
  }, [update, visible, text]);

  return (
    <>
      {visible && (
        <StyledPopperContainer
          ref={setPopperElement}
          style={{ ...styles.popper, ...animatedTooltip }}
          {...attributes.popper}
        >
          <div ref={setArrowElement} style={styles.arrow} id="arrow" />
          <StyledTooltipContent>{text}</StyledTooltipContent>
        </StyledPopperContainer>
      )}
    </>
  );
};
