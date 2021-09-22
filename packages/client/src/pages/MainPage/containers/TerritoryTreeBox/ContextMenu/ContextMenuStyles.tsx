import { FaChevronCircleDown } from "react-icons/fa";
import { TiDocumentText } from "react-icons/ti";
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
  top: ${({ $clientY }) => `${($clientY - heightHeader) / 10}rem`};
  left: ${({ $clientX }) => `${($clientX + 20) / 10}rem`};
  z-index: 100;
`;
export const StyledTiDocumentText = styled(TiDocumentText)`
  color: ${({ theme }) => theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[1]}`};
  cursor: pointer;
`;
