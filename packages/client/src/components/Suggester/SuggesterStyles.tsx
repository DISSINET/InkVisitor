import styled from "styled-components";
import { space1, space2, space24 } from "Theme/constants";

export const StyledSuggester = styled.div`
  position: relative;
`;

interface InputWrapper {
  isOver: boolean;
}
export const InputWrapper = styled.div<InputWrapper>`
  display: flex;
  align-items: flex-end;
  opacity: ${({ isOver }) => isOver && "75%"};
`;

export const SuggesterButton = styled.div``;
export const SuggesterList = styled.div`
  position: absolute;
  left: ${space24};
  background-color: ${({ theme }) => theme.colors["grey"]};
  padding: ${space1};
  width: auto;
  z-index: 10;
`;
export const SuggestionLine = styled.div`
  display: block;
  padding: ${space1};
`;
