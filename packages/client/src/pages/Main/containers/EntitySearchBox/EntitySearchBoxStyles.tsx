import { MIN_SEARCH_RESULT_HEIGHT } from "Theme/constants";
import { Button } from "components";
import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.color["white"]};
  overflow: auto;
`;

interface StyledOptionsProps {
  $isUndersized?: boolean;
}
export const StyledOptions = styled.div<StyledOptionsProps>`
  padding-top: 0.5rem;
  padding-right: ${({ $isUndersized }) => ($isUndersized ? "0.5rem" : "1rem")};
  padding-left: ${({ $isUndersized }) => ($isUndersized ? "0.5rem" : "1rem")};
`;
export const StyledRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space["32"]} 1fr;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledCellMerge = styled.div`
  grid-column: 1 / -1;
`;
export const StyledAdvancedOptions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.space[4]};
  height: 3rem;
  margin-bottom: 0.5rem;
  border: 1px dashed ${({ theme }) => theme.color["gray"][300]};
  border-radius: 5rem;
  cursor: default;

  &:hover {
    border-style: solid;
  }
`;

export const StyledDropdownWithTypeBar = styled.div`
  position: relative;
  display: flex;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  /* padding-left: 0.4rem; */
`;

export const StyledRowHeader = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  display: block;
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  text-align: right;
`;
export const StyledRowContent = styled.div`
  display: flex;
`;
export const StyledResultsWrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  min-height: ${MIN_SEARCH_RESULT_HEIGHT}px;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  //overflow-y: hidden;
  position: relative;
`;
export const StyledResultsHeader = styled.div`
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  font-size: ${({ theme }) => theme.fontSize.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledResultHeading = styled.h6`
  width: 100%;
`;
export const StyledTagLoaderWrap = styled.div`
  min-height: 3rem;
`;

export const StyledDateTag = styled.div`
  background-color: ${({ theme }) => theme.color["gray"][600]};
  padding: 0.2rem 0.8rem;
  border-radius: ${({ theme }) => theme.space[2]};
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const StyledDateTagText = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["white"]};
  margin-right: ${({ theme }) => theme.space[4]};
  align-self: center;
`;

export const StyledDateTagButton = styled(Button)``;

export const StyledAdvancedOptionsSign = styled.div<{ $isUndersized?: boolean }>`
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  white-space: nowrap;
  column-gap: 0.2rem;
  padding-right: 0.2rem;
  padding-left: ${({ $isUndersized }) => ($isUndersized ? "0" : "0.3rem")};
  padding-bottom: 0.1rem;
  color: ${({ theme }) => theme.color.primary};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  font-size: 1.1rem;
`;
export const StyledAdvancedOptionsIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  margin-right: 0.1rem;
`;

export const StyledFloatingContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  align-items: flex-start;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["white"]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.space[3]};
  padding-bottom: ${({ theme }) => theme.space[5]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

export const StyledFloatingContainerTitle = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledFloatingActions = styled.div`
  position: absolute;
  bottom: 0.5rem;
  right: 0.8rem;
`;

export const StyledButtonsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledPillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
  align-items: flex-start;
  justify-content: center;
  width: 100%;
`;

export const StyledPillWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-right: 0.25rem;
`;
export const StyledPill = styled.div<{ $selected?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 2rem;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border: 1px solid
    ${({ theme, $selected }) => ($selected ? theme.color["primary"] : theme.color["gray"][300])};
  user-select: none;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledPillLabel = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  white-space: nowrap;
`;

export const StyledPillCloseIcon = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  cursor: pointer;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border-radius: 2rem;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;

  ${StyledPill}:hover &,
  ${StyledPill}:active &,
  ${StyledPill}:focus & {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
`;

export const StyledNoResults = styled.p`
  font-style: italic;
  font-size: 1.4rem;
  margin: 0.5rem;
  color: ${({ theme }) => theme.color.black};
`;
