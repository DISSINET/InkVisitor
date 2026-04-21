import styled from "styled-components";
import { ThemeFontSize } from "Theme/theme";
import { UserTagVariant } from "./utils";

interface StyledUserTagWrapProps {
  $borderColor: string;
  $backgroundColor: string;
  $textColor: string;
  $variant: UserTagVariant;
  $size: keyof ThemeFontSize;
}

export const StyledUserTagWrap = styled.span<StyledUserTagWrapProps>`
  display: inline-flex;
  align-items: center;

  .tag {
    border-color: ${({ $borderColor }) => $borderColor};
    border-style: solid;
    font-size: ${({ theme, $size }) => theme.fontSize[$size]};
  }

  .tag > div {
    background-color: ${({ $backgroundColor }) => $backgroundColor};
  }

  .tag > div > div {
    color: ${({ $textColor }) => $textColor};
    font-weight: ${({ theme, $variant }) =>
      $variant === "filled" ? theme.fontWeight.bold : theme.fontWeight.normal};
  }
`;

export const StyledUserTag = styled.div`
  display: flex;
`;

interface StyledUserIconProps {
  $color: string;
}

export const StyledUserIcon = styled.span<StyledUserIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  padding-left: 0.3rem;
`;
