import { FaCircle, FaDotCircle } from "react-icons/fa";
import styled from "styled-components";

export const StyledTerritoryTagWrap = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 3px;
`;
export const StyledIconWrap = styled.div`
  cursor: pointer;
`;
interface StyledChildrenWrap {
  isExpanded?: boolean;
}
export const StyledChildrenWrap = styled.div<StyledChildrenWrap>`
  margin-left: ${({ theme }) => theme.space[3]};
`;
export const StyledFaDotCircle = styled(FaDotCircle)`
  margin-left: 0.3rem;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.colors["primary"]};
`;
export const StyledFaCircle = styled(FaCircle)`
  margin-left: 0.3rem;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.colors["primary"]};
`;
