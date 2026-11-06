import styled from "styled-components";

/**
 * The project's location types, one row each, laid out as a table that scrolls
 * sideways where the modal is narrower than it.
 */
export const StyledKindScroll = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  overflow-x: auto;
`;

const COLUMNS = "2.4rem 11rem 21rem 11rem 2.2rem 4.5rem minmax(14rem, 1fr) 2.2rem";

export const StyledKindHeader = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: ${({ theme }) => theme.space[2]};
  min-width: 70rem;
  padding-bottom: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** A column title with a help mark beside it. */
export const StyledKindHeadHelp = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

/** The mark that opens the help: a button, so it can be reached and opened from the keyboard. */
export const StyledHelpMark = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: help;
`;

/** What each gazetteer location type covers, set out in the tooltip of its column title. */
export const StyledEngineTypeHelp = styled.div`
  max-width: 28rem;
  text-align: left;

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
    margin: ${({ theme }) => theme.space[2]} 0 0;
  }

  dt {
    font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  }

  dd {
    margin: 0;
  }
`;

export const StyledKindRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: ${({ theme }) => theme.space[2]};
  align-items: center;
  min-width: 70rem;
  padding: ${({ theme }) => theme.space[1]} 0;
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledKindCell = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

export const StyledKindCount = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
`;

/** How many of a count are only inferred, paler than the count itself. */
export const StyledKindInferred = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The mark a location type carries, as the button that opens the set to choose another. */
export const StyledIconButton = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.color["black"]};
  background: ${({ theme, $open }) => ($open ? theme.color["gray"][200] : theme.color["white"])};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledIconAnchor = styled.div`
  position: relative;
`;

export const StyledIconBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
`;

export const StyledIconPanel = styled.div<{ $top: number; $left: number }>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  z-index: 10001;
  display: grid;
  grid-template-columns: repeat(10, 2.2rem);
  gap: ${({ theme }) => theme.space[1]};
  margin-top: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]};
  background: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

export const StyledIconChoice = styled.button<{ $current: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme, $current }) => ($current ? theme.color["white"] : theme.color["black"])};
  background: ${({ theme, $current }) => ($current ? theme.color["primary"] : "transparent")};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

/** The favourite toggle: filled while this location type is the one offered first for its gazetteer location type. */
export const StyledFavorite = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  font-size: ${({ theme }) => theme.fontSize.base};
  color: ${({ theme, $on }) => ($on ? theme.color["warning"] : theme.color["gray"][500])};
  background: transparent;
  border: none;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.4;
  }
`;

export const StyledKindActions = styled.div`
  grid-column: 1 / -1;
  margin-top: ${({ theme }) => theme.space[2]};
`;

export const StyledKindHeadRight = styled.span`
  text-align: right;
`;
