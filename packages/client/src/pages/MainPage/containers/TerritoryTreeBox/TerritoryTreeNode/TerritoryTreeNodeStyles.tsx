import { FaCircle, FaDotCircle } from "react-icons/fa";
import { animated } from "react-spring";
import styled from "styled-components";

export const StyledTerritoryTagWrap = styled(animated.div)`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
export const StyledIconWrap = styled.div`
  cursor: pointer;
`;
interface StyledChildrenWrap {
  noIndent?: boolean;
}
export const StyledChildrenWrap = styled.div<StyledChildrenWrap>`
  margin-left: ${({ theme, noIndent }) => (noIndent ? 0 : theme.space[3])};
`;
export const StyledFaDotCircle = styled(FaDotCircle)`
  margin: 0 ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["primary"]};
  stroke-width: 0.5;
`;
export const StyledFaCircle = styled(FaCircle)`
  margin: 0 ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["primary"]};
  stroke-width: 0.5;
`;
export const StyledDisabledTag = styled.div`
  height: 2.25rem;
  padding: 0.25;
  border: 2px dotted black;
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  margin-bottom: 0.25rem;
`;
