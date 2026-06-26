import styled from "styled-components";
import { UserTagSize, UserTagVariant } from "./utils";

interface StyledUserTagWrapProps {
  $borderColor: string;
  $backgroundColor: string;
  // $size: keyof ThemeFontSize;
}

export const StyledUserTagWrap = styled.span<StyledUserTagWrapProps>`
  display: inline-flex;
  align-items: center;

  /* contributor badge: pale pill carries the name field, a solid accent disc
     floats on top of it — the two-tone split is what reads as a person */
  .tag {
    align-items: center;
    gap: ${({ theme }) => theme.space[1]};
    padding-left: ${({ theme }) => theme.space[1]};
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
}

/* name field: transparent (sits on the pill's pale background); slight
   letter-spacing makes it read as a name, not a CTA */
export const StyledUserLabel = styled.div<StyledUserLabelProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  padding: 0 ${({ theme }) => theme.space[3]} 0 ${({ theme }) => theme.space[2]};
  /* divider line between the role icon and the name */
  border-left: 1px solid ${({ $borderColor }) => $borderColor};
  /* transparent: the pill (StyledUserTagWrap .tag) already paints the field */
  background-color: transparent;
  color: ${({ $textColor }) => $textColor};
  letter-spacing: 0.02em;
  font-weight: ${({ theme, $fontWeight }) =>
    $fontWeight === "bold" ? theme.fontWeight.bold : theme.fontWeight.normal};
  font-size: ${({ theme, $size }) =>
    $size === UserTagSize.Small
      ? theme.fontSize.xs
      : $size === UserTagSize.Medium
        ? theme.fontSize.sm
        : $size === UserTagSize.Large
          ? theme.fontSize.base
          : $size === UserTagSize.ExtraLarge
            ? theme.fontSize.lg
            : theme.fontSize.lg};
`;
