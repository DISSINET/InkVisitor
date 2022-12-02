import {
  AutoPlacement,
  BasePlacement,
  VariationPlacement,
  VirtualElement,
} from "@popperjs/core";
import React, { ReactElement, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { usePopper } from "react-popper";
import { useSpring } from "react-spring";
import { Colors } from "types";
import {
  StyledArrow,
  StyledContainer,
  StyledContent,
  StyledLabel,
  StyledRow,
} from "./TooltipStyles";

interface Tooltip {
  // essential
  visible: boolean;
  referenceElement: Element | VirtualElement | null;
  // content
  label?: string;
  content?: ReactElement[] | ReactElement;
  tagGroup?: boolean;
  // style
  color?: typeof Colors[number];
  position?: AutoPlacement | BasePlacement | VariationPlacement;
  noArrow?: boolean;
  offsetX?: number;
  offsetY?: number;

  disabled?: boolean;
  disableAutoPosition?: boolean;
  onMouseLeave?: () => void;
}
export const Tooltip: React.FC<Tooltip> = ({
  // essential
  visible = false,
  referenceElement,
  // content
  label = "",
  content,
  tagGroup = false,
  // style
  color = "black",
  position = "bottom",
  noArrow = false,
  offsetX = 0,
  offsetY = 7,

  disabled = false,
  disableAutoPosition = false,
  onMouseLeave = () => {},
}) => {
  const [popperElement, setPopperElement] =
    useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);
  const { styles, attributes, update, state, forceUpdate } = usePopper(
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
          enabled: !disableAutoPosition,
          options: {
            fallbackPlacements: ["auto"],
          },
        },
      ],
    }
  );

  const [showTooltip, setShowTooltip] = useState(false);
  useEffect(() => {
    visible ? setShowTooltip(true) : setShowTooltip(false);
  }, [visible]);

  const [tooltipHovered, setTooltipHovered] = useState(false);

  const animatedTooltip = useSpring({
    opacity: showTooltip ? 1 : 0,
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
  }, [update, visible, label, content]);

  return (
    <>
      {!disabled && (showTooltip || tooltipHovered) && (
        <>
          {ReactDOM.createPortal(
            <StyledContainer
              ref={setPopperElement}
              style={{ ...styles.popper, ...animatedTooltip }}
              color={color}
              onMouseLeave={() => {
                onMouseLeave();
                setTooltipHovered(false);
              }}
              arrowoffset={-offsetY}
              onMouseEnter={() => {
                setTooltipHovered(true);
              }}
              {...attributes.popper}
            >
              {!noArrow && (
                <StyledArrow
                  id="arrow"
                  ref={setArrowElement}
                  style={styles.arrow}
                />
              )}
              <div>
                {label && (
                  <StyledContent color={color}>
                    <StyledRow>
                      <StyledLabel>{label}</StyledLabel>
                    </StyledRow>
                  </StyledContent>
                )}
                {content && (
                  <StyledContent color={color} tagGroup={tagGroup}>
                    {content}
                  </StyledContent>
                )}
              </div>
            </StyledContainer>,
            document.getElementById("page")!
          )}
        </>
      )}
    </>
  );
};
