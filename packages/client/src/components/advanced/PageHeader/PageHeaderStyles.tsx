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
  margin-top: 1.6rem;
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
  white-space: nowrap;
`;
export const StyledUsername = styled.div`
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledRightHeader = styled.div`
  display: flex;
`;
export const StyledThemeSwitcher = styled.div`
  display: inline-flex;
  border-radius: 1.2rem;
  overflow: hidden;
  cursor: pointer;
  margin-right: 1rem;
  border-width: 0.2rem;
  border-style: solid;
  border-color: ${({ theme }) => theme.color.gray["800"]};
`;

interface StyledThemeSwitcherIcon {
  selected: boolean;
}
export const StyledThemeSwitcherIcon = styled.div<StyledThemeSwitcherIcon>`
  padding: 0.5rem 0.8rem;
  font-size: 15px;
  transition: 0.3s all;
  background-color: ${({ theme, selected }) =>
    selected ? theme.color.gray[800] : theme.color.gray[600]};
  color: ${({ theme, selected }) =>
    selected ? "white" : theme.color.gray[400]};
`;

export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[4]};
`;

export const StyledMenu = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledLoaderWrap = styled.div`
  height: 1rem;
  width: 1rem;
  position: relative;
  margin-right: 2rem;
`;

interface StyledPingColor {
  $pingColor: keyof PingColor;
}
export const StyledPingColor = styled.div<StyledPingColor>`
  width: 1rem;
  height: 1rem;
  border: 0.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background-color: ${({ theme, $pingColor }) => theme.color.ping[$pingColor]};
  margin-right: 0.3rem;
  margin-left: 0.3rem;
`;
export const StyledPingText = styled.p`
  font-size: 1rem;
  opacity: 0.8;
`;

export const StyledFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledFlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const StyledSandboxText = styled.div`
  max-width: 40rem;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  display: flex;
  color: ${({ theme }) => theme.color["danger"]};
`;
export const StyledSpace = styled.div`
  display: flex;
  flex-grow: 1;
`;
