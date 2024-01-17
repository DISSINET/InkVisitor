import { animated } from "@react-spring/web";
import { IoReloadCircle } from "react-icons/io5";
import styled from "styled-components";

export const StyledDescription = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-bottom: 1rem;
`;
export const StyledEmailSent = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledAnimatedIconWrap = styled(animated.div)`
  margin-top: 1rem;
  margin-bottom: 2rem;
`;
export const StyledIoReloadCircle = styled(IoReloadCircle)`
  cursor: pointer;
`;
