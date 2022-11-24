import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
  VirtualElement,
} from "@popperjs/core";
import React, { ReactElement, useEffect, useState } from "react";
import { usePopper } from "react-popper";
import { useSpring } from "react-spring";
import { Colors } from "types";
import {
  StyledContainer,
  StyledContent,
  StyledLabel,
  StyledRow,
} from "./TooltipNewStyles";

interface TooltipNew {
  visible: boolean;

  label?: string;
  content?: ReactElement[] | ReactElement;
  tagGroup?: boolean;

  referenceElement: Element | VirtualElement | null;
  noArrow?: boolean;
  // style
  color?: typeof Colors[number];
  position?: AutoPlacement | BasePlacement | VariationPlacement;
  offsetX?: number;
  offsetY?: number;
}
export const TooltipNew: React.FC<TooltipNew> = ({
  visible = false,

  label = "",
  content,
  tagGroup = false,

  referenceElement,
  noArrow = false,

  // style
  color = "black",
  position = "bottom",
  offsetX = 0,
  offsetY = 8,
}) => {
  const [popperElement, setPopperElement] =
    useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes, update, state } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: position,
      modifiers: [
        { name: "arrow", options: { element: arrowElement } },
        {
          name: "offset",
          options: {
            offset: [offsetX, offsetY],
          },
        },
        {
          name: "flip",
          options: {
            fallbackPlacements: ["auto"],
            // fallbackPlacements: ["top", "right", "left", "bottom"],
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
  }, [update, visible, label]);

  return (
    <>
      {visible && (
        <StyledContainer
          ref={setPopperElement}
          style={{ ...styles.popper, ...animatedTooltip }}
          color={color}
          {...attributes.popper}
        >
          {!noArrow && (
            <div ref={setArrowElement} style={styles.arrow} id="arrow" />
          )}
          {label && (
            <StyledContent>
              <StyledRow>
                <StyledLabel>{label}</StyledLabel>
              </StyledRow>
            </StyledContent>
          )}
          {content && (
            <StyledContent tagGroup={tagGroup}>{content}</StyledContent>
          )}
        </StyledContainer>
      )}
    </>
  );
};
