import { animated } from "react-spring";
import styled from "styled-components";

export const StyledHeader = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
export const StyledHeaderBreadcrumbRow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: left;
  margin-top: 0.2rem;
  height: 2.7rem;
  margin-bottom: 0.8rem;
`;

export const StyledMoveToParent = styled(animated.div)`
  position: relative;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  margin-left: 0.3rem;
`;

export const StyledInfoText = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  margin-left: 0.3rem;
`;
export const StyledHeadingText = styled.div``;
export const StyledSuggesterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding-right: 0.5rem;
  height: 2.5rem;
  margin-bottom: 0.6rem;
`;
export const StyledActionsWrapper = styled.div`
  padding-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
export const StyledCounter = styled.div`
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledDropdownWrap = styled.div``;
export const StyledCheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${({ theme }) => theme.color["black"]};
`;
