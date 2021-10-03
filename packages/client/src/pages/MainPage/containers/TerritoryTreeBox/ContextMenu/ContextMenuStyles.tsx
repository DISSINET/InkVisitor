import { CgMenuBoxed } from "react-icons/cg";
import { animated } from "react-spring";
import styled from "styled-components";
import { heightHeader } from "Theme/constants";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
interface StyledContextButtonGroup {
  $clientX: number;
  $clientY: number;
  height: number;
}
export const StyledContextButtonGroup = styled(
  animated.div
)<StyledContextButtonGroup>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: ${({ $clientY }) => `${($clientY - heightHeader - 2) / 10}rem`};
  left: ${({ $clientX }) => `${($clientX + 20) / 10}rem`};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  z-index: 100;
`;
export const StyledCgMenuBoxed = styled(CgMenuBoxed)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `0 ${theme.space[1]}`};
  cursor: pointer;
`;
