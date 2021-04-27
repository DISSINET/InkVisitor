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
  flex-direction: row;
  position: absolute;
  top: ${({ clientY }) => `${(clientY - 85) / 10}rem`};
  left: ${({ clientX }) => `${clientX / 10}rem`};
  z-index: 100;
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  cursor: pointer;
`;
