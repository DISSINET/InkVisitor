// PROTOTYPE: throwaway styles for the sentence query builder demo.
import styled, { css, DefaultTheme, keyframes } from "styled-components";

// the noun a clause attaches to picks its colour, so the reader sees which
// part of the sentence each clause talks about
const nounColors = (theme: DefaultTheme) => [
  theme.color["query2"],
  theme.color["warning"],
  theme.color["danger"],
  theme.color["info"],
];
export const nounColor = (theme: DefaultTheme, nounOrder: number) =>
  nounColors(theme)[nounOrder % nounColors(theme).length];

export const StyledPrototype = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  margin: ${({ theme }) => theme.space[2]};
  border: ${({ theme }) => theme.borderWidth[1]} dashed ${({ theme }) => theme.color["query2"]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["text"]};
  font-size: ${({ theme }) => theme.fontSize.sm};
`;

export const StyledPrototypeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledPrototypeBadge = styled.span`
  padding: 0 ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  background-color: ${({ theme }) => theme.color["query2"]};
  color: ${({ theme }) => theme.color["white"]};
  font-weight: bold;
  letter-spacing: 0.05em;
`;

export const StyledSentence = styled.div`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  min-height: 3.2rem;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.sm};
  cursor: text;
`;

export const StyledWord = styled.span<{ $color: string; $isNoun?: boolean }>`
  padding: 0 ${({ theme }) => theme.space[1]};
  border-bottom: 0.2rem solid ${({ $color }) => $color};
  ${({ $isNoun }) =>
    $isNoun &&
    css`
      font-weight: bold;
    `}
`;

export const StyledInputPart = styled.span`
  position: relative;
  flex: 1;
  display: flex;
  min-width: 14rem;
`;

export const StyledSentenceInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: ${({ theme }) => theme.color["text"]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  &::placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
  }
`;

export const StyledSuggestionList = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  min-width: 32rem;
  max-height: 26rem;
  overflow-y: auto;
  margin: ${({ theme }) => theme.space[1]} 0 0 0;
  padding: ${({ theme }) => theme.space[1]} 0;
  list-style: none;
  font-size: ${({ theme }) => theme.fontSize.sm};
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  box-shadow: 0 0.4rem 1.2rem ${({ theme }) => theme.color["primaryTransparent"]};
`;

export const StyledSuggestion = styled.li<{ $active: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  align-items: baseline;
  cursor: pointer;
  background-color: ${({ theme, $active }) =>
    $active ? theme.color["tableSelectionHover"] : "transparent"};
  /* the option stays on one line, a long hint gives way */
  & > span:first-child {
    flex-shrink: 0;
    white-space: nowrap;
  }
`;

export const StyledSuggestionHint = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.color["mutedText"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

export const StyledHelpLine = styled.div`
  color: ${({ theme }) => theme.color["mutedText"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

export const StyledTemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledTemplate = styled.button<{ $active: boolean }>`
  text-align: left;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme, $active }) => ($active ? theme.color["query2"] : theme.color["gray"][300])};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme, $active }) =>
    $active ? theme.color["tableSelectionHover"] : theme.color["white"]};
  color: ${({ theme }) => theme.color["text"]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  cursor: pointer;
`;

export const StyledBlank = styled.span`
  color: ${({ theme }) => theme.color["mutedText"]};
  font-style: italic;
`;

export const StyledActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledSwitcher = styled.div`
  position: fixed;
  bottom: ${({ theme }) => theme.space[6]};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: 999px;
  background-color: ${({ theme }) => theme.color["black"]};
  color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  box-shadow: 0 0.4rem 1.6rem ${({ theme }) => theme.color["modalBg"]};
`;

export const StyledSwitcherArrow = styled.button`
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize.lg};
  cursor: pointer;
`;

export const StyledRemoveButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["mutedText"]};
  cursor: pointer;
  opacity: 0;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
  &:focus-visible {
    opacity: 1;
  }
`;

// one part of the sentence, with its menu of alternatives anchored under it
export const StyledPart = styled.span`
  position: relative;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  &:hover ${StyledRemoveButton} {
    opacity: 1;
  }
`;

export const StyledSwappableWord = styled(StyledWord)<{ $isOpen: boolean }>`
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  background-color: ${({ theme, $isOpen }) =>
    $isOpen ? theme.color["tableSelectionHover"] : "transparent"};
  &:hover {
    background-color: ${({ theme }) => theme.color["tableSelectionHover"]};
  }
`;

const blink = keyframes`
  50% {
    opacity: 0;
  }
`;

// a click target right after a picked entity, wide enough to hit, drawn as a
// blinking text cursor while its menu is open
export const StyledCaretSlot = styled.span<{ $isOpen: boolean }>`
  position: relative;
  align-self: stretch;
  width: 0.8rem;
  min-height: 1.6em;
  cursor: text;
  &::before {
    content: "";
    position: absolute;
    top: 15%;
    bottom: 15%;
    left: 0.2rem;
    border-left: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["text"]};
    opacity: 0;
    ${({ $isOpen }) =>
      $isOpen &&
      css`
        animation: ${blink} 1s step-end infinite;
        opacity: 1;
      `}
  }
`;

// AND / OR between the clauses on one noun
export const StyledOperatorWord = styled.span<{ $color: string; $isClickable: boolean }>`
  padding: 0 ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius.xs};
  color: ${({ $color }) => $color};
  font-weight: bold;
  text-transform: uppercase;
  ${({ $isClickable, theme }) =>
    $isClickable &&
    css`
      cursor: pointer;
      &:hover {
        background-color: ${theme.color["tableSelectionHover"]};
      }
    `}
`;
