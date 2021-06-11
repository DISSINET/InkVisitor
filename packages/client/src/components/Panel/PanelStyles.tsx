import { animated } from "react-spring";
import styled from "styled-components";

import { heightHeader, heightFooter } from "Theme/constants";

interface StyledPanel {}
export const StyledPanel = styled(animated.div)<StyledPanel>`
  display: flex;
  flex-direction: column;
  /* display: grid; */
  height: 100% - ${heightHeader - heightFooter};
`;
