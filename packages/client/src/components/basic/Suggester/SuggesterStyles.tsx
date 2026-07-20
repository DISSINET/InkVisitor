import { AiOutlineWarning } from "react-icons/ai";
import styled from "styled-components";
import { ThemeColor } from "Theme/theme";
import { space2 } from "Theme/theme-space-shortcut";
import { DEFAULT_DIVIDER_HEIGHT } from "components/basic/Input/InputStyles";

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
  $accentColor: keyof ThemeColor;
}
export const StyledInputWrapper = styled.div<InputWrapper>`
  position: relative;
  display: flex;
  opacity: ${({ $isOver }) => $isOver && "50%"};
  width: 100%;
  height: 2.5rem;
  background-color: ${({ theme }) => theme.color["white"]};
  border-style: solid;
  border-width: 0.1rem;
  border-color: ${({ $isFocused, $accentColor, theme }) =>
    $isFocused ? String(theme.color[$accentColor]) : theme.color["gray"]["500"]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: -0.1rem;
    border-radius: inherit;
    border: 0.2rem solid transparent;
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    border-color: ${({ $accentColor, theme }) => String(theme.color[$accentColor])};
    &::after {
      border-color: ${({ $accentColor, theme }) => String(theme.color[$accentColor])};
    }
  }

  ${({ $isFocused, $accentColor, theme }) =>
    $isFocused &&
    `
    &::after {
      border-color: ${String(theme.color[$accentColor])};
    }
  `}
  input[type="text"],
  .react-select__control {
    /* border-color: transparent !important; */
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

// vertical divider separating the injected rightContent (e.g. the annotator's
// elvl group) from the create button inside the input's trailing slot
export const StyledRightContentDivider = styled.div`
  height: ${DEFAULT_DIVIDER_HEIGHT};
  width: ${({ theme }) => theme.borderWidth[1]};
  background-color: ${({ theme }) => theme.color["gray"][300]};
  flex-shrink: 0;
  margin: 0 0.1rem;
`;
