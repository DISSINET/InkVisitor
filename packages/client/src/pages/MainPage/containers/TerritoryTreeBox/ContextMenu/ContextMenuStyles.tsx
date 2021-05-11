import { FaChevronCircleDown } from "react-icons/fa";
import styled from "styled-components";
import { heightHeader } from "Theme/constants";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
interface StyledContextButtonGroup {
  showMenu?: boolean;
  clientX: number;
  clientY: number;
  height: number;
}
export const StyledContextButtonGroup = styled.div<StyledContextButtonGroup>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: ${({ clientY, height }) =>
    `${(clientY - heightHeader - height / 4) / 10}rem`};
  left: ${({ clientX }) => `${(clientX + 20) / 10}rem`};
  z-index: 100;

  &.fade-enter {
    opacity: 0;
  }
  &.fade-enter-active {
    opacity: 1;
    transition: opacity 300ms ease-out;
  }
  &.fade-exit {
    opacity: 1;
  }
  &.fade-exit-active {
    opacity: 0;
    transition: opacity 300ms ease-out;
  }
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  cursor: pointer;
`;
