import styled from "styled-components";
import { ThemeFontSize, ThemeType } from "Theme/theme";
import { UserTagSize, UserTagVariant } from "./utils";

/* size grows the pill through height and the name's font; inset and padding
   stay at the small tag's values so larger tags don't read as airy */
const sizeScale: Record<
  UserTagSize,
  { height: string; inset: keyof ThemeType["space"]; padding: keyof ThemeType["space"]; font: keyof ThemeFontSize }
> = {
  [UserTagSize.Small]: { height: "2.25rem", inset: 2, padding: 2, font: "xs" },
  [UserTagSize.Medium]: { height: "2.75rem", inset: 2, padding: 2, font: "sm" },
  [UserTagSize.Large]: { height: "3.25rem", inset: 2, padding: 2, font: "base" },
  [UserTagSize.ExtraLarge]: { height: "3.75rem", inset: 2, padding: 2, font: "lg" },
};

interface StyledUserTagWrapProps {
  $borderColor: string;
  $backgroundColor: string;
  $showOnly?: "tag" | "label";
  $size: UserTagSize;
}

export const StyledUserTagWrap = styled.span<StyledUserTagWrapProps>`
  display: inline-flex;
  align-items: center;

  /* contributor badge: pale pill carries the name field, a solid accent disc
     floats on top of it — the two-tone split is what reads as a person */
  .tag {
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.space[1]};
    /* the icon takes the inset on its outer side; the name pads itself */
    padding-left: ${({ theme, $showOnly, $size }) =>
      $showOnly === "label" ? 0 : theme.space[sizeScale[$size].inset]};
    padding-right: ${({ theme, $showOnly, $size }) =>
      $showOnly === "tag" ? theme.space[sizeScale[$size].inset] : 0};
    height: ${({ $size }) => sizeScale[$size].height};
    border-color: ${({ $borderColor }) => $borderColor};
    border-style: solid;
    border-width: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.default};
    background-color: ${({ $backgroundColor }) => $backgroundColor};
    font-size: 1.1rem;
  }
`;

interface StyledUserTagProps {
  $backgroundColor: string;
  $borderColor: string;
}

/* circular avatar disc: floats inside the pill with a small inset so it reads
   as a true circle, holding the role icon in the solid accent colour */
export const StyledUserTag = styled.div<StyledUserTagProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100% - ${({ theme }) => theme.space[2]});
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
`;

interface StyledUserIconProps {
  $color: string;
}

export const StyledUserIcon = styled.span<StyledUserIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

interface StyledUserLabelProps {
  $backgroundColor: string;
  $textColor: string;
  $borderColor: string;
  $variant: UserTagVariant;
  $size: UserTagSize;
  $fontWeight: "normal" | "bold";
  $showDivider: boolean;
}

/* name field: transparent (sits on the pill's pale background); slight
   letter-spacing makes it read as a name, not a CTA */
export const StyledUserLabel = styled.div<StyledUserLabelProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  padding: 0 ${({ theme, $size }) => theme.space[sizeScale[$size].padding]};
  /* divider line between the role icon and the name */
  border-left: ${({ $borderColor, $showDivider }) =>
    $showDivider ? `1px solid ${$borderColor}` : "none"};
  /* transparent: the pill (StyledUserTagWrap .tag) already paints the field */
  background-color: transparent;
  color: ${({ $textColor }) => $textColor};
  letter-spacing: 0.02em;
  font-weight: ${({ theme, $fontWeight }) =>
    $fontWeight === "bold" ? theme.fontWeight.bold : theme.fontWeight.normal};
  font-size: ${({ theme, $size }) => theme.fontSize[sizeScale[$size].font]};
`;
