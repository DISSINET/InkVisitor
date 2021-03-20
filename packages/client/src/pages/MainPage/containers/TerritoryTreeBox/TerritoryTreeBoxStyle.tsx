import { FaDotCircle } from "react-icons/fa";
import styled from "styled-components";

export const StyledTerritoryTagWrap = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 3px;
`;
export const StyledIconWrap = styled.div`
  cursor: pointer;
`;
export const StyledChildrenWrap = styled.div`
  margin-left: ${({ theme }) => theme.space[3]};
`;
export const StyledFaDotCircle = styled(FaDotCircle)`
  margin: 0 0.3rem;
  color: ${({ theme }) => theme.colors["primary"]};
`;
