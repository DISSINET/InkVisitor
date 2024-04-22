import { animated } from "@react-spring/web";
import { GrDocumentText } from "react-icons/gr";
import styled from "styled-components";
import { heightHeader } from "Theme/constants";

export const StyledMenuGroupWrapper = styled.div`
  position: absolute;
  top: ${(heightHeader - 36) / 10}rem;
  right: ${({ theme }) => theme.space[1]};

  margin-top: ${({ theme }) => theme.space[1]};
  padding-top: 2.7rem;

  z-index: 10;
  min-width: 200px;
`;

export const StyledMenuGroup = styled.div`
  border: ${({ theme }) => "3px solid " + theme.color["primary"]};

  box-shadow: ${({ theme }) => "-5px 5px 5px " + theme.color.menuShadow};
  border-radius: ${({ theme }) => theme.space[2]};
`;

interface StyledMenuItem {}
export const StyledMenuItem = styled(animated.div)<StyledMenuItem>`
  padding: ${({ theme }) => theme.space[3]};
  cursor: pointer;
  svg {
    margin-right: ${({ theme }) => theme.space[2]};
    vertical-align: middle;
  }
`;
