import React, { useLayoutEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";
import { FlatThemeColor, ThemeBorderRadius } from "Theme/theme";

export type ButtonGroupGap = "no" | "small" | "large";

const gapSize: Record<ButtonGroupGap, string> = {
  no: "0",
  small: "0.25rem",
  large: "0.75rem",
};

interface ButtonGroup {
  $gap?: ButtonGroupGap;
  $column?: boolean;
  $marginBottom?: boolean;
  $marginTop?: boolean;
  $height?: number;
  $borderRadius?: keyof ThemeBorderRadius;
  $disableShrink?: boolean;
}
export const ButtonGroup = styled.div.attrs({
  className: "buttongroup",
})<ButtonGroup>`
  display: flex;
  height: ${({ $height }) => ($height ? `${$height / 10}rem` : "")};
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  margin-top: ${({ $marginTop, theme }) => ($marginTop ? theme.space[2] : "")};
  margin-bottom: ${({ $marginBottom, theme }) => ($marginBottom ? theme.space[2] : "")};
  border-radius: ${({ $borderRadius, theme }) =>
    $borderRadius ? theme.borderRadius[$borderRadius] : "none"};
  overflow: hidden;
  flex-shrink: ${({ $disableShrink }) => ($disableShrink ? 0 : "")};
  > button:not(:last-child),
  > span:not(:last-child) {
    flex-shrink: ${({ $disableShrink }) => ($disableShrink ? 0 : "")};
    /* an ancestor may set --button-group-gap to change the default for its area */
    margin-right: ${({ $gap }) => ($gap ? gapSize[$gap] : "var(--button-group-gap, 0.5rem)")};
  }
`;

/** For groups whose selected option renders bold, which is wider: every label
 * reserves its bold width so the buttons keep their size as the selection moves. */
export const reserveBoldLabelWidth = css`
  > button > span[data-label]::after {
    content: attr(data-label);
    font-weight: ${({ theme }) => theme.fontWeight["bold"]};
    display: block;
    height: 0;
    overflow: hidden;
    visibility: hidden;
  }
`;

interface StyledSwitchGroup {
  $column?: boolean;
  $bgColor?: string;
  $borderColor?: FlatThemeColor;
  $zIndex?: number;
}
const StyledSwitchGroup = styled.div<StyledSwitchGroup>`
  position: relative;
  display: inline-flex;
  flex-direction: ${({ $column }) => ($column ? "column" : "row")};
  align-items: stretch;
  gap: 0.15rem;
  padding: 0.25rem;
  background-color: ${({ theme, $bgColor }) => $bgColor ?? theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  overflow: hidden;
  border: ${({ theme, $borderColor }) =>
    $borderColor ? `${theme.borderWidth[1]} solid ${theme.color[$borderColor]}` : "none"};
  z-index: ${({ $zIndex }) => $zIndex ?? "auto"};
  > button {
    margin: 0;
    display: flex;
    align-items: center;
    /* the segments sit above the pill that marks the selected one */
    position: relative;
    z-index: 1;
  }
  ${reserveBoldLabelWidth}
`;

interface PillRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const samePillRect = (a: PillRect | null, b: PillRect | null) =>
  a === b ||
  (!!a &&
    !!b &&
    a.left === b.left &&
    a.top === b.top &&
    a.width === b.width &&
    a.height === b.height);

interface StyledSwitchPill {
  $left: number;
  $top: number;
  $width: number;
  $height: number;
  $color: FlatThemeColor;
}
const StyledSwitchPill = styled.span<StyledSwitchPill>`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
  width: ${({ $width }) => $width}px;
  height: ${({ $height }) => $height}px;
  transform: translate(${({ $left }) => $left}px, ${({ $top }) => $top}px);
  background-color: ${({ theme, $color }) => theme.color[$color]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-sm"]};
  transition:
    transform 0.2s ease,
    width 0.2s ease,
    height 0.2s ease;
  pointer-events: none;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

interface SwitchGroup extends StyledSwitchGroup, React.HTMLAttributes<HTMLDivElement> {
  /** Index of the selected button. Marks it with a pill that slides between the
   * segments; the buttons themselves have to be transparent for it to show. */
  activeIndex?: number;
  /** Fill of that pill — matches the `color` the selected button carries. */
  pillColor?: FlatThemeColor;
}
export const SwitchGroup: React.FC<SwitchGroup> = ({
  activeIndex,
  pillColor = "primary",
  children,
  ...styleProps
}) => {
  const groupRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<PillRect | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group || activeIndex === undefined) {
      setPill(null);
      return;
    }
    const measure = () => {
      const segment = group.querySelectorAll<HTMLElement>(":scope > button")[activeIndex];
      const next = segment
        ? {
            left: segment.offsetLeft,
            top: segment.offsetTop,
            width: segment.offsetWidth,
            height: segment.offsetHeight,
          }
        : null;
      // `children` is a fresh array on every render of the parent, so this runs
      // on every render: it has to settle on an unchanged geometry
      setPill((prev) => (samePillRect(prev, next) ? prev : next));
    };
    measure();
    // segment widths settle after the label font loads and shift whenever the
    // group is re-laid out, neither of which re-renders this component
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [activeIndex, children]);

  return (
    <StyledSwitchGroup ref={groupRef} {...styleProps}>
      {/* mounts already positioned under the selected segment, so the slide
          only ever runs on a later selection */}
      {pill && (
        <StyledSwitchPill
          $left={pill.left}
          $top={pill.top}
          $width={pill.width}
          $height={pill.height}
          $color={pillColor}
        />
      )}
      {children}
    </StyledSwitchGroup>
  );
};

export const ButtonGroups = styled.div`
  display: flex;
  .buttongroup {
    margin-left: ${({ theme }) => theme.space[1]};
  }
`;
