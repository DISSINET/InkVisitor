import { EntityEnums } from "@inkvisitor/shared/enums";
import styled from "styled-components";

interface StyledTagWrapper {
  $tagBorderColorKey: EntityEnums.Status;
  $borderStyleKey: EntityEnums.LogicalType;
  $dragDisabled: boolean;
}
export const StyledTagWrapper = styled.div<StyledTagWrapper>`
  display: inline-flex;
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth[2]};
  border-color: ${({ theme, $tagBorderColorKey }) =>
    theme.color.tagBorderColor[$tagBorderColorKey]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-style: solid;
  border-left-style: ${({ theme, $borderStyleKey }) => theme.borderStyle[$borderStyleKey]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  height: 2.25rem;

  cursor: ${({ $dragDisabled }) => ($dragDisabled ? "default" : "move")};
  user-select: none;
`;

export const StyledItalic = styled.i`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
