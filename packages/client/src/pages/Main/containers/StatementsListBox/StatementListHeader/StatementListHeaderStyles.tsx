import { FaStar } from "react-icons/fa";
import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: left;
`;

export const StyledHeaderBreadcrumbRowLeft = styled.div`
  display: inline-flex;
  align-items: center;
`;
export const StyledMoveToParent = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  /* float: right; */
  color: ${({ theme }) => theme.color["info"]};
  margin-bottom: 0.5rem;
  margin-left: 0.3rem;
  margin-top: 0.3rem;
`;
export const StyledHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
export const StyledFaStar = styled(FaStar)`
  float: left;
  margin-top: 0.4rem;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.color["warning"]};
`;
export const StyledModeSwitcher = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  margin-left: 0.3rem;
  /* margin-bottom: ${({ theme }) => theme.space[2]}; */
  /* margin-top: 0.3rem; */
`;
export const StyledHeading = styled.span`
  color: ${({ theme }) => theme.color["black"]};
  font-weight: bold;
  font-size: ${({ theme }) => theme.fontSize["xl"]};
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
`;
export const StyledHeadingText = styled.div``;
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
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledDropdownWrap = styled.div`
  margin: 0 0.5rem;
`;
export const StyledCheckboxWrapper = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
`;
