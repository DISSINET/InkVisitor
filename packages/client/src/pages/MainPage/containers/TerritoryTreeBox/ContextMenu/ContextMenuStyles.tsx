import { FaChevronCircleDown } from "react-icons/fa";
import styled from "styled-components";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
`;
interface StyledContextButtonGroup {
  showMenu?: boolean;
}
export const StyledContextButtonGroup = styled.div<StyledContextButtonGroup>`
  display: ${({ showMenu }) => (showMenu ? "flex" : "none")};
  flex-direction: column;
  position: absolute;
  top: ${({ theme }) => theme.space[8]};
  z-index: 100;
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  cursor: pointer;
`;
