import styled from "styled-components";
import { UserTagVariant } from "./utils";

interface StyledUserTagWrapProps {
  $borderColor: string;
  $backgroundColor: string;
  $textColor: string;
  $variant: UserTagVariant;
}

export const StyledUserTagWrap = styled.span<StyledUserTagWrapProps>`
  display: inline-flex;
  align-items: center;

  .tag {
    border-color: ${({ $borderColor }) => $borderColor};
    border-style: solid;
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

interface StyledUserIconProps {
  $color: string;
}

export const StyledUserIcon = styled.span<StyledUserIconProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  padding: 0 ${({ theme }) => theme.space[2]};
`;
