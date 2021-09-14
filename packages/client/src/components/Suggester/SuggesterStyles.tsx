import styled from "styled-components";
import { space1, space2, space4, space36 } from "Theme/constants";

interface StyledSuggester {
  marginTop?: boolean;
}
export const StyledSuggester = styled.div<StyledSuggester>`
  position: relative;
  margin-top: ${({ marginTop }) => (marginTop ? space2 : 0)};
`;

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
export const StyledSuggesterList = styled.div`
  position: absolute;
  left: 0;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  padding: ${space1};
  width: auto;
  z-index: 10;
  display: grid;
  grid-template-columns: 1.5em 10em 2em;
  grid-template-rows: auto;
  grid-auto-flow: row;
  align-items: center;

  > div {
    margin-bottom: ${space1};
  }
`;

export const StyledSuggestionCancelButton = styled.div`
  position: absolute;
  left: 7.5em;
  top: 4px;
  svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledSuggestionLineIcons = styled.div``;

export const StyledSuggestionLineTag = styled.div``;

export const StyledSuggestionLineActions = styled.div`
  cursor: pointer;
`;
