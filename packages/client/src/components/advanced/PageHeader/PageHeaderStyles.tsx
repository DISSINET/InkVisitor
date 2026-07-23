import { PingColor } from "Theme/theme";
import { AiOutlineWarning } from "react-icons/ai";
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

export const StyledUserIconWrap = styled.div`
  display: flex;
  cursor: pointer;
`;
export const StyledUsername = styled.div`
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
`;
export const StyledRightHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[7]};
  padding-right: ${({ theme }) => theme.space[2]};
`;
export const StyledThemeSwitcherWrap = styled.div`
  display: inline-flex;
  align-items: center;
`;

export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  cursor: pointer;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  transition: background-color 0.2s;
  /* same hover tint as the borderless header buttons (Menu, theme switcher) */
  &:hover {
    background: color-mix(in srgb, currentColor 12%, transparent);
  }
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
  $clickable?: boolean;
}
export const StyledPingColor = styled.div<StyledPingColor>`
  width: 1rem;
  height: 1rem;
  border: 0.5px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  background-color: ${({ theme, $pingColor }) => theme.color.ping[$pingColor]};
  margin-right: 0.3rem;
  margin-left: 0.3rem;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};
`;

export const StyledStatsWrap = styled.div`
  position: relative;
  display: inline-block;
`;

export const StyledStatsPanel = styled.div`
  position: absolute;
  top: 1.6rem;
  left: 0;
  z-index: 100;
  min-width: 13rem;
  padding: 0.5rem 0.75rem;
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: 0.25rem;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.25);
  font-size: 0.75rem;
  font-family: monospace;
  line-height: 1.35;
  white-space: nowrap;
`;

export const StyledStatsHeading = styled.div`
  font-weight: bold;
  margin-top: 0.25rem;
  &:first-child {
    margin-top: 0;
  }
`;

/* --- "HTML instead of JSON" diagnostic capture indicator + popup --- */
export const StyledHtmlCaptureWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 0.5rem;
`;

export const StyledHtmlCaptureIcon = styled(AiOutlineWarning)`
  cursor: pointer;
  color: ${({ theme }) => theme.color["warning"]};
  vertical-align: middle;
`;

export const StyledHtmlCapturePanel = styled.div`
  position: absolute;
  top: 1.6rem;
  left: 0;
  z-index: 100;
  width: 26rem;
  max-width: 80vw;
  padding: 0.6rem 0.75rem;
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: 0.25rem;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.25);
  font-size: 0.8rem;
  line-height: 1.4;
`;

export const StyledHtmlCaptureText = styled.div`
  margin-bottom: 0.5rem;
  & strong {
    font-weight: bold;
  }
`;

export const StyledHtmlCapturePre = styled.pre`
  margin: 0 0 0.5rem 0;
  padding: 0.4rem 0.5rem;
  max-height: 16rem;
  overflow: auto;
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: 0.2rem;
  font-family: monospace;
  font-size: 0.7rem;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: break-word;
`;

export const StyledHtmlCaptureActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

export const StyledStatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  & > span:last-child {
    opacity: 0.85;
  }
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
  height: 1.4rem;
`;

export const StyledSandboxText = styled.div`
  max-width: 40rem;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  display: flex;
  color: ${({ theme }) => theme.color["warningText"]};
`;
export const StyledSpace = styled.div`
  display: flex;
  flex-grow: 1;
`;
export const StyledLoggedAsWrap = styled.div`
  min-width: 3rem;
  position: relative;
  display: flex;
  align-items: center;
`;
/** Owner-only header action; wrapper keeps it aligned with its neighbours. */
export const StyledGlobalValidationsWrap = styled.div`
  display: flex;
  align-items: center;
`;
