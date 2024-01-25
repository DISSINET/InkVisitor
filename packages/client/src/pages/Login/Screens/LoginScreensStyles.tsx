import { animated } from "@react-spring/web";
import { FaUserAlt, FaLock } from "react-icons/fa";
import { IoReloadCircle } from "react-icons/io5";
import { TbMailFilled } from "react-icons/tb";
import styled from "styled-components";

export const StyledDescription = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-bottom: 1rem;
`;
export const StyledInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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
interface StyledIcon {
  $isError?: boolean;
}
export const StyledFaUserAlt = styled(FaUserAlt)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, $isError }) =>
    $isError ? theme.color["danger"] : theme.color["primary"]};
`;
export const StyledFaLock = styled(FaLock)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, $isError }) =>
    $isError ? theme.color["danger"] : theme.color["primary"]};
`;
export const StyledTbMailFilled = styled(TbMailFilled)<StyledIcon>`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme, $isError }) =>
    $isError ? theme.color["danger"] : theme.color["primary"]};
`;
