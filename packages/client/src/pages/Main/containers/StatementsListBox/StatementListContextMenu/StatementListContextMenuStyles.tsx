import { ReferenceType } from "@floating-ui/react";
import { animated } from "@react-spring/web";
import { CgMenuBoxed } from "react-icons/cg";
import styled from "styled-components";

interface StyledCgMenuBoxed {
  $inverted?: boolean;
}
export const StyledCgMenuBoxed = styled(CgMenuBoxed)<StyledCgMenuBoxed>`
  color: ${({ theme, $inverted }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[1]}`};
  cursor: default;
`;
export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
export const StyledContextBtnGroup = styled(animated.div)`
  display: flex;
  flex-direction: row;
  z-index: 100;
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;
