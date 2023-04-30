import { PingColor } from "Theme/theme";
import { FaUserAlt } from "react-icons/fa";
import styled from "styled-components";

interface StyledHeaderLogo {
  height: number;
}
export const StyledHeaderLogo = styled.img<StyledHeaderLogo>`
  height: ${({ height }) => (height ? `${height / 10}rem` : "auto")};
  padding: ${({ theme }) => theme.space[4]};
  cursor: pointer;
`;

export const StyledHeader = styled.div`
  display: flex;
`;

export const StyledHeaderTag = styled.div`
  cursor: copy;
  font-size: 1.2rem;
  margin-top: 2.6rem;
  opacity: 0.8;
  padding: ${({ theme }) => theme.space[2]};
  padding-bottom: 0;
`;

export const StyledFaUserAlt = styled(FaUserAlt)`
  cursor: pointer;
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUsername = styled.div`
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledRightHeader = styled.div`
  display: flex;
`;
export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[4]};
`;
export const StyledLoaderWrap = styled.div`
  height: 1rem;
  width: 1rem;
  position: relative;
  margin-right: 2rem;
`;

interface StyledPingColor {
  pingColor: keyof PingColor;
}
export const StyledPingColor = styled.div<StyledPingColor>`
  width: 1rem;
  height: 1rem;
  border: 1px solid ${({ theme }) => theme.color["white"]};
  border-radius: 50%;
  background-color: ${({ theme, pingColor }) => theme.color.ping[pingColor]};
  margin-right: 0.5rem;
  margin-left: 0.3rem;
`;
export const StyledPingText = styled.p`
  font-size: 1rem;
  opacity: 0.8;
`;
