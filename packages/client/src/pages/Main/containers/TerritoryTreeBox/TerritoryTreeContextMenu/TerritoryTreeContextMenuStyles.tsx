import { animated } from "@react-spring/web";
import { CgMenuBoxed } from "react-icons/cg";
import styled from "styled-components";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
export const StyledContextButtonGroup = styled(animated.div)`
  display: flex;
  flex-direction: row;
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledCgMenuBoxed = styled(CgMenuBoxed)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `0 ${theme.space[1]}`};
`;
