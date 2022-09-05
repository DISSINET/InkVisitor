import { animated } from "react-spring";
import styled from "styled-components";

interface StyledPanel {}
export const StyledPanel = styled(animated.div)<StyledPanel>`
  display: flex;
  flex-direction: column;
  height: 100%;
`;
