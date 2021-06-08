import { animated } from "react-spring";
import styled from "styled-components";
import { space2 } from "Theme/constants";

interface StyledBox {
  color: string;
  width: number;
  height: number;
}
export const StyledBox = styled(animated.div)<StyledBox>`
  position: relative;
  display: flex;
  flex-direction: column;
  width: ${({ width }) => `${width / 10}rem`};
  height: ${({ height }) => (height ? `${height / 10}rem` : "100%")};
`;
interface StyledHead {
  color: string;
}
export const StyledHead = styled(animated.div)<StyledHead>`
  background-color: ${({ theme, color }) => theme.color[color]};
  color: ${({ theme }) => theme.color["white"]};
  padding: ${space2};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  line-height: 2rem;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-style: normal;
  text-transform: uppercase;
  border-color: ${({ theme }) => theme.color["grey"]};
  border-style: dashed;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-bottom: none;
`;
interface StyledContent {
  noPadding: boolean;
  color: string;
}
export const StyledContent = styled(animated.div)<StyledContent>`
  background-color: ${({ theme }) => theme.color["white"]};
  padding: ${({ theme, noPadding }) => (noPadding ? 0 : theme.space[2])};
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSize["base"]};

  border-color: ${({ theme, color }) => theme.color[color]};
  border-style: solid;
  border-width: ${({ theme }) => theme.borderWidth[2]};
  border-top: none;
`;

export const StyledVerticalText = styled(animated.div)`
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: ${({ theme }) => theme.fontSize["base"]};
  color: ${({ theme }) => theme.color["white"]};
`;
