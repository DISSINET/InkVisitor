import { EntityEnums } from "@shared/enums";
import styled from "styled-components";

interface StyledTagWrapper {
  $status: EntityEnums.Status;
  $ltype: EntityEnums.LogicalType;
  $dragDisabled: boolean;
}
export const StyledTagWrapper = styled.div<StyledTagWrapper>`
  display: inline-flex;
  overflow: hidden;
  border: ${({ theme }) => theme.borderWidth[2]};
  border-color: ${({ theme, $status }) => theme.color.tagStatus[$status]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  border-style: ${({ theme, $ltype }) => "solid solid solid " + theme.borderStyle[$ltype]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  height: 2.25rem;

  cursor: ${({ $dragDisabled }) => ($dragDisabled ? "default" : "move")};
  user-select: none;
`;

interface StyledButtonWrapper {
  $status: EntityEnums.Status;
}
export const StyledButtonWrapper = styled.div<StyledButtonWrapper>`
  display: flex;
  button {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[2]};
    border-left-color: ${({ theme, $status }) => theme.color.tagStatus[$status]};
    border-left-style: solid;
  }
`;

export const StyledElvlWrapper = styled.div`
  display: flex;
  > div {
    border-width: 0;
    border-left-width: ${({ theme }) => theme.borderWidth[1]};
    border-left-color: ${({ theme }) => theme.color["black"]};
    border-left-style: solid;
  }
`;

export const StyledItalic = styled.i`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
