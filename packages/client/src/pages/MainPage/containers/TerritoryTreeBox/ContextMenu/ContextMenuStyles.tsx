import { FaChevronCircleDown } from "react-icons/fa";
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
  clientx: number;
  clienty: number;
  height: number;
}
export const StyledContextButtonGroup = styled(
  animated.div
)<StyledContextButtonGroup>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: ${({ clienty, height }) =>
    `${(clienty - heightHeader - height / 4) / 10}rem`};
  left: ${({ clientx }) => `${(clientx + 20) / 10}rem`};
  z-index: 100;
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  cursor: pointer;
`;
