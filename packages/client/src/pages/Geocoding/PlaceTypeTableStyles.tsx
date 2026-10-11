import styled from "styled-components";

/**
 * The project's kinds of place, one row each, laid out as a table that scrolls
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
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
  text-align: right;
`;

/** The mark a kind carries, as the button that opens the set to choose another. */
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
  z-index: 10;
`;

export const StyledIconPanel = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 11;
  display: grid;
  grid-template-columns: repeat(7, 2.2rem);
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
  color: ${({ theme, $current }) =>
    $current ? theme.color["white"] : theme.color["black"]};
  background: ${({ theme, $current }) => ($current ? theme.color["primary"] : "transparent")};
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
  }
`;

/** The favourite toggle: filled while this kind is the one offered first for its engine type. */
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
