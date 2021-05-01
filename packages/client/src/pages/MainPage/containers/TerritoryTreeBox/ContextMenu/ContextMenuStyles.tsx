import { FaChevronCircleDown } from "react-icons/fa";
import styled from "styled-components";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  /* position: relative; */
`;
interface StyledContextButtonGroup {
  showMenu?: boolean;
  clientX: number;
  clientY: number;
}
export const StyledContextButtonGroup = styled.div<StyledContextButtonGroup>`
  display: ${({ showMenu }) => (showMenu ? "flex" : "none")};
  /* display: flex; */
  opacity: ${({ showMenu }) => (showMenu ? 1 : 0)};
  flex-direction: row;
  position: absolute;
  top: ${({ clientY }) => `${(clientY - 75) / 10}rem`};
  left: ${({ clientX }) => `${(clientX + 20) / 10}rem`};
  z-index: 100;

  transition: opacity display 0.3s;
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  cursor: pointer;
`;
