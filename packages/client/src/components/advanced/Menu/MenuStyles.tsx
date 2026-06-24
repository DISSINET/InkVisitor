import { animated } from "@react-spring/web";
import styled from "styled-components";
import { heightHeader } from "Theme/constants";

export const StyledMenuGroupWrapper = styled.div`
  position: absolute;
  top: ${(heightHeader - 36) / 10}rem;
  right: ${({ theme }) => theme.space[1]};

  margin-top: ${({ theme }) => theme.space[1]};
  padding-top: 2.7rem;

  z-index: 10001;
  min-width: 20rem;
`;

export const StyledMenuGroup = styled.div`
  border: ${({ theme }) => "3px solid " + theme.color["primary"]};

  box-shadow: ${({ theme }) => "-5px 5px 5px " + theme.color.menuShadow};
  border-radius: ${({ theme }) => theme.space[2]};
`;

interface StyledMenuItem {}
export const StyledMenuItem = styled(animated.div)<StyledMenuItem>`
  height: 3.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  svg {
    vertical-align: middle;
  }
`;

export const StyledIcon = styled.div`
  width: 3.5rem;
  margin-left: 0.1rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledMenuDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.color.primary};
  opacity: 0.7;
`;
