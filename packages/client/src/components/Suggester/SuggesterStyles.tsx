import styled from "styled-components";
import { space1, space2, space4, space36 } from "Theme/constants";

interface StyledSuggester {
  marginTop?: boolean;
}
export const StyledSuggester = styled.div<StyledSuggester>`
  position: relative;
  margin-top: ${({ marginTop }) => (marginTop ? space2 : 0)};
`;

export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, entity }) => theme.color[entity]};
  width: 3px;
  left: 1px;
  top: 1px;
  bottom: 1px;
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
export const StyledSuggestionCancelButton = styled.div`
  position: absolute;
  left: 7.5em;
  top: 4px;
  svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;
interface StyledTypeBar {
  entity: string;
}

export const StyledSuggesterList = styled.div`
  position: absolute;
  left: 0;
  z-index: 10;
`;
export const StyledRelativePosition = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  min-width: 16.1rem;
  max-width: 24rem;
  display: grid;

  grid-template-columns: 2.5rem auto 3rem;
  grid-template-rows: auto;
  grid-auto-flow: row;
  align-items: center;
  min-height: 3rem;
  padding-bottom: ${space1};

  > div {
    padding-top: ${space1};
  }
`;

export const StyledSuggestionLineActions = styled.div<Column>`
  display: grid;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][100] : "transparent"};

  cursor: pointer;
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
