import styled from "styled-components";
import { space1, space2, space23 } from "Theme/constants";

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
  left: ${space23};
  background-color: ${({ theme }) => theme.colors["blue"][50]};
  padding: ${space1};
  width: auto;
  z-index: 10;
`;
export const SuggestionLine = styled.div`
  display: block;
  padding: ${space1};
`;
