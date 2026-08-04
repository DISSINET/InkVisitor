import { animated } from "@react-spring/web";
import { FaLock, FaUserAlt } from "react-icons/fa";
import { TbMailFilled } from "react-icons/tb";
import styled from "styled-components";

export const StyledDescription = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-bottom: 1rem;
`;
export const StyledEmailSent = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledEmailSentIconWrap = styled.div`
  margin: 0.5rem 0 1.5rem 0;
`;
export const StyledAnimatedIconWrap = styled(animated.div)`
  margin-top: 1rem;
  margin-bottom: 2rem;
`;
interface StyledIcon {
  $isError?: boolean;
}
export const StyledFaUserAlt = styled(FaUserAlt)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : theme.color["primary"])};
`;
export const StyledFaLock = styled(FaLock)<StyledIcon>`
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
export const StyledTbMailFilled = styled(TbMailFilled)<StyledIcon>`
  color: ${({ theme, $isError }) => ($isError ? theme.color["danger"] : "")};
`;
