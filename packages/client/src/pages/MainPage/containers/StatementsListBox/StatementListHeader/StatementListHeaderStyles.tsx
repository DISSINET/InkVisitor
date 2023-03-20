import { FaStar } from "react-icons/fa";
import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
`;
export const StyledHeaderRow = styled.h3`
  /* overflow: hidden; */
`;
export const StyledFaStar = styled(FaStar)`
  float: left;
  margin-top: 0.5rem;
  margin-right: 0.3rem;
`;
export const StyledMoveToParent = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  float: right;
  color: ${({ theme }) => theme.color["info"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  margin-left: 0.3rem;
  margin-top: 0.3rem;
`;
export const StyledHeading = styled.span`
  word-wrap: break-word;
`;
export const StyledSuggesterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledActionsWrapper = styled.div`
  padding-left: 0.5rem;
  display: flex;
  align-items: center;
`;
export const StyledCounter = styled.div`
  white-space: nowrap;
  margin-left: 0.5rem;
  color: black;
`;
export const StyledDropdownWrap = styled.div`
  margin: 0 0.5rem;
`;
