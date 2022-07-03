import { FaUserAlt, FaLock } from "react-icons/fa";
import styled from "styled-components";
import { layoutWidthBreakpoint } from "Theme/constants";

interface StyledPage {
  layoutWidth: number;
}
export const StyledPage = styled.div<StyledPage>`
  width: ${({ layoutWidth }) => layoutWidth};
  min-width: ${layoutWidthBreakpoint};
  height: 100vh;
`;
export const StyledUserBox = styled.div`
  display: flex;
`;
export const StyledUser = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.space[4]};
`;
interface StyledPanelWrap {}
export const StyledPanelWrap = styled.div`
  width: 100%;
  overflow: hidden;
  display: flex;
  position: relative;
`;

export const StyledFaUserAlt = styled(FaUserAlt)`
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledUsername = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
export const StyledButtonWrap = styled.div``;

export const StyledContentWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 2rem 3rem;
`;
export const StyledHeading = styled.h5`
  color: ${({ theme }) => theme.color["primary"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  margin-bottom: 1.5rem;
`;
export const StyledInputRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid;
  border-bottom-color: ${({ theme }) => theme.color["gray"][400]};
  margin-bottom: 1rem;
`;
export const StyledFaLock = styled(FaLock)`
  margin-right: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["primary"]};
`;
