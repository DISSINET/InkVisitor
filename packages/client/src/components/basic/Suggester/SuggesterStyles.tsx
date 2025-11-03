import { AiOutlineWarning } from "react-icons/ai";
import styled from "styled-components";
import { space2 } from "Theme/theme-space-shortcut";

interface StyledSuggester {
  $marginTop?: boolean;
  $fullWidth?: boolean;
  $isFocused?: boolean;
}
export const StyledSuggester = styled.div<StyledSuggester>`
  position: relative;
  display: ${({ $fullWidth }) => ($fullWidth ? "flex" : "inline-flex")};

  margin-top: ${({ $marginTop }) => ($marginTop ? space2 : 0)};

  input[type="text"] {
    border-width: ${({ $isFocused }) => ($isFocused ? "2px" : "1px")};
  }
  .react-select__control {
    border-width: ${({ $isFocused }) =>
      $isFocused ? "2px !important" : "1px"};
  }
`;

interface Column {}
interface InputWrapper {
  $isOver: boolean;
  $hasButton: boolean;
}
export const StyledInputWrapper = styled.div<InputWrapper>`
  display: flex;
  opacity: ${({ $isOver }) => $isOver && "50%"};
  width: 100%;
  height: 2.5rem;
  input[type="text"] {
    border-left-width: 0;
    border-right-width: ${({ $hasButton }) => ($hasButton ? 0 : "")};
  }
  select {
    border-right-width: 0;
  }
`;
export const StyledSuggesterButton = styled.div`
  border: 1px solid ${({ theme }) => theme.color["primary"]};
`;

export const StyledSuggesterList = styled.div`
  z-index: 160;
`;
interface StyledRelativePosition {
  $width?: number;
}
export const StyledRelativePosition = styled.div<StyledRelativePosition>`
  position: relative;
  background-color: ${({ theme }) => theme.color["blue"][50]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  min-width: 16.1rem;
  /* max-width: 24rem; */
  max-width: ${({ $width }) => (!$width ? "24rem" : "")};
  width: ${({ $width }) => ($width ? `${$width / 10}rem` : "")};

  overflow: hidden;
  display: grid;

  min-height: 2.8rem;
`;
interface StyledSuggestionRow {
  $twoIcons: boolean;
  $isSelected: boolean;
}
export const StyledSuggestionRow = styled.div<StyledSuggestionRow>`
  display: grid;
  grid-template-columns: ${({ $twoIcons }) => ($twoIcons ? "4rem" : "2.5rem")} auto 3rem;
  align-items: center;
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.color["blue"][100] : "transparent"};
`;
export const StyledSuggestionLineActions = styled.div<Column>`
  margin-left: ${({ theme }) => theme.space[2]};
  margin-right: ${({ theme }) => theme.space[2]};
`;
export const StyledSuggestionLineTag = styled.div<Column>`
  display: grid;
  align-items: center;
  height: 100%;
`;
export const StyledSuggestionLineIcons = styled.div<Column>`
  display: grid;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledTagWrapper = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledAiOutlineWarning = styled(AiOutlineWarning)`
  /* position: absolute; */
  margin-top: 0.1rem;
  margin-left: 0.5rem;
`;

export const SuggesterHidden = styled.div`
  display: none;
`;
