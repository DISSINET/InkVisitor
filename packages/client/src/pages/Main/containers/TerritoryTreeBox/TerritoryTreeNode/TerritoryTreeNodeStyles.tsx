import { FaCircle, FaDotCircle } from "react-icons/fa";
import { animated } from "@react-spring/web";
import styled from "styled-components";

interface StyledTerritoryTagWrap {
  $dimmed?: boolean;
}
export const StyledTerritoryTagWrap = styled(animated.div)<StyledTerritoryTagWrap>`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[1]};
  /* rows that miss the filter recede instead of the matches being painted: the
     indentation stays readable and selection remains the only filled row.
     Applied through filter, since the inline opacity carries the mount spring */
  filter: ${({ $dimmed }) => ($dimmed ? "opacity(0.35)" : "none")};
  transition: filter 0.15s ease-in-out;
`;
export const StyledIconWrap = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.color["primary"]};
`;
interface StyledChildrenWrap {
  $noIndent?: boolean;
}
export const StyledChildrenWrap = styled.div<StyledChildrenWrap>`
  margin-left: ${({ theme, $noIndent }) => ($noIndent ? 0 : theme.space[3])};
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
