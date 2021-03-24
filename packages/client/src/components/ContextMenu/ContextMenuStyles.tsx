import { FaChevronCircleDown } from "react-icons/fa";
import styled from "styled-components";

export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: relative;
`;
export const StyledContextButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: ${({ theme }) => theme.space[8]};
  z-index: 10;
`;
export const StyledFaChevronCircleDown = styled(FaChevronCircleDown)`
  color: ${({ theme }) => theme.colors["primary"]};
  margin: 0 ${({ theme }) => theme.space[2]};
  cursor: pointer;
`;
