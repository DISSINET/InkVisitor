import { AiOutlineWarning } from "react-icons/ai";
import styled from "styled-components";
import { space1, space2, space4, space36 } from "Theme/constants";

interface StyledSuggester {
  marginTop?: boolean;
}
export const StyledSuggester = styled.div<StyledSuggester>`
  position: relative;
  display: inline-flex;
  margin-top: ${({ marginTop }) => (marginTop ? space2 : 0)};
`;

interface Column {
  isSelected: boolean;
}
interface InputWrapper {
  isOver: boolean;
  hasButton: boolean;
}
export const StyledInputWrapper = styled.div<InputWrapper>`
  display: flex;
  opacity: ${({ isOver }) => isOver && "75%"};
  max-width: 16.1rem;
  input {
    padding-right: ${space4};
  }
  input[type="text"] {
    border-left-width: 0;
    border-right-width: ${({ hasButton }) => (hasButton ? 0 : "")};
  }
  select {
    border-right-width: 0;
  }
`;
export const StyledSuggesterButton = styled.div`
  border: 1px solid ${({ theme }) => theme.color["primary"]};
`;
interface StyledSuggestionCancelButton {
  hasButton: boolean;
}
export const StyledSuggestionCancelButton = styled.div<StyledSuggestionCancelButton>`
  position: absolute;
  right: ${({ theme, hasButton }) =>
    hasButton ? theme.space[10] : theme.space[1]};
  top: 4px;
  svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledSuggesterList = styled.div`
  position: absolute;
  top: 2.5rem;
  left: 0;
  z-index: 40;
`;
export const StyledRelativePosition = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  min-width: 16.1rem;
  max-width: 24rem;
  display: grid;

  min-height: 2.8rem;
`;
interface StyledSuggestionRow {
  twoIcons: boolean;
}
export const StyledSuggestionRow = styled.div<StyledSuggestionRow>`
  display: grid;
  grid-template-columns: ${({ twoIcons }) => (twoIcons ? "5rem" : "2.5rem")} auto 3rem;
  align-items: center;
`;
export const StyledSuggestionLineActions = styled.div<Column>`
  display: grid;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][100] : "transparent"};
`;
export const StyledSuggestionLineTag = styled.div<Column>`
  display: grid;
  align-items: center;
  height: 100%;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][100] : "transparent"};
`;
export const StyledSuggestionLineIcons = styled.div<Column>`
  display: grid;
  height: 100%;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][100] : "transparent"};
`;
export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledAiOutlineWarning = styled(AiOutlineWarning)`
  margin-top: 0.1rem;
  margin-left: 0.5rem;
`;
