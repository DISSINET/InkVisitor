import { AiOutlineWarning } from "react-icons/ai";
import styled from "styled-components";
import { ThemeColor } from "Theme/theme";
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
`;

interface Column {}
interface InputWrapper {
  $isOver: boolean;
  $hasButton: boolean;
  $isFocused?: boolean;
  // selected entity-class colour; tints the hover/focus ring
  $accentColor: keyof ThemeColor;
}
export const StyledInputWrapper = styled.div<InputWrapper>`
  position: relative;
  display: flex;
  opacity: ${({ $isOver }) => $isOver && "50%"};
  width: 100%;
  height: 2.5rem;
  /* The whole suggester reads as a single rounded, bordered group. Inner segments
     are borderless and clipped to the rounded shape; the hover/focus highlight
     lives here on the outer (visible) edge. */
  background-color: ${({ theme }) => theme.color["white"]};
  border-style: solid;
  border-width: ${({ $isFocused }) => ($isFocused ? "1px" : "1px")};
  border-color: ${({ $isFocused, $accentColor, theme }) =>
    $isFocused ? $accentColor : theme.color["gray"]["600"]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  overflow: hidden;

  &:hover {
    border-color: ${({ $accentColor }) => $accentColor};
  }

  /* Neutralize inner element borders; the TypeBar and the trailing button divider
     provide the internal separators. */
  input[type="text"],
  .react-select__control {
    border-color: transparent !important;
  }
  select {
    border-right-width: 0;
  }
`;
export const StyledSuggesterList = styled.div`
  /* Rendered in a #page-content portal that forms no stacking context, so this
     competes at the body level with the modal wrap (z 500). Match the other
     floating portal menus (Tooltip, DatePicker) so the dropdown clears modals. */
  z-index: 10000;
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
