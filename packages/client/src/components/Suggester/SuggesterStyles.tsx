import styled from "styled-components";
import { space1, space2, space36 } from "Theme/constants";

interface StyledSuggester {
  marginTop?: boolean;
}
export const StyledSuggester = styled.div<StyledSuggester>`
  position: relative;
  margin-top: ${({ marginTop }) => (marginTop ? space2 : 0)};
`;

interface InputWrapper {
  isOver: boolean;
}
export const InputWrapper = styled.div<InputWrapper>`
  display: flex;
  opacity: ${({ isOver }) => isOver && "75%"};
`;

export const SuggesterButton = styled.div``;
export const SuggesterList = styled.div`
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

export const SuggestionLineIcons = styled.div``;

export const SuggestionLineTag = styled.div``;

export const SuggestionLineActions = styled.div`
  cursor: pointer;
`;
