import styled from "styled-components";
import { UserTagSize, UserTagVariant } from "./utils";

interface StyledUserTagWrapProps {
  $borderColor: string;
  // $size: keyof ThemeFontSize;
}

export const StyledUserTagWrap = styled.span<StyledUserTagWrapProps>`
  display: inline-flex;
  align-items: center;

  .tag {
    border-color: ${({ $borderColor }) => $borderColor};
    border-style: solid;
    border-width: 1px;
    font-size: 1.1rem;
  }
`;

interface StyledUserTagProps {
  $backgroundColor: string;
}

export const StyledUserTag = styled.div<StyledUserTagProps>`
  display: flex;
  background-color: ${({ $backgroundColor }) => $backgroundColor};
`;

interface StyledUserIconProps {
  $color: string;
}

export const StyledUserIcon = styled.span<StyledUserIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  padding-left: ${({ theme }) => theme.space[2]};
`;

interface StyledUserLabelProps {
  $backgroundColor: string;
  $textColor: string;
  $variant: UserTagVariant;
  $size: UserTagSize;
}

export const StyledUserLabel = styled.div<StyledUserLabelProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${({ theme }) => theme.space[2]};
  background-color: ${({ $backgroundColor }) => $backgroundColor};
  color: ${({ $textColor }) => $textColor};
  font-weight: ${({ theme, $variant }) =>
    $variant === "filled" || $variant === "inverted"
      ? theme.fontWeight.bold
      : theme.fontWeight.normal};
  font-size: ${({ theme, $size }) =>
    $size === UserTagSize.Small
      ? theme.fontSize.xs
      : $size === UserTagSize.Medium
      ? theme.fontSize.sm
      : $size === UserTagSize.Large
      ? theme.fontSize.base
      : theme.fontSize.lg};
`;
