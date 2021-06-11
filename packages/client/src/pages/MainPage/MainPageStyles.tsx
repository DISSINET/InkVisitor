import { FaUserAlt } from "react-icons/fa";
import styled from "styled-components";
import { layoutWidthBreakpoint, widthElasticBoundaries } from "Theme/constants";

export const StyledPage = styled.div`
  width: 100%;
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
export const StyledPanelWrap = styled.div`
  /* display: flex; */
  width: 100%;
  overflow: hidden;
  display: grid;
  grid-template-columns: ${widthElasticBoundaries[0]}% ${widthElasticBoundaries[1]}% ${widthElasticBoundaries[2]}% ${widthElasticBoundaries[3]}%;
  grid-template-rows: 100%;
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
export const StyledButtonWrap = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[2]};
  right: ${({ theme }) => theme.space[2]};
`;
