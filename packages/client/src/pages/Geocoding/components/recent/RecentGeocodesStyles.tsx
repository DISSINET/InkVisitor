import styled, { css, keyframes } from "styled-components";

/**
 * The strip of places just given a coordinate, drawn over the map's left edge
 * under the search field.
 *
 * Lower than the search field's hits, which drop over it: a list of hits that
 * the strip drew through would be unreadable.
 */
const BELOW_SEARCH = "5.2rem";

export const StyledRecent = styled.div<{ $wide: boolean }>`
  position: absolute;
  top: ${BELOW_SEARCH};
  left: ${({ theme }) => theme.space[2]};
  z-index: 1;
  width: ${({ $wide }) => ($wide ? "36rem" : "26rem")};
  transition: width 0.15s ease-in-out;
  max-width: calc(100% - ${({ theme }) => theme.space[8]});
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  overflow: hidden;
`;

export const StyledRecentHead = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["black"]};
  text-align: left;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledRecentCount = styled.span`
  margin-left: auto;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledRecentCaret = styled.span<{ $open: boolean }>`
  display: flex;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.15s ease-in-out;
`;

export const StyledRecentList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 22rem;
  overflow-y: auto;
  border-top: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

/** An entry grows into the head of the list and its row settles from success green. */
const arrive = (success: string) => keyframes`
  from {
    max-height: 0;
    opacity: 0;
    background-color: ${success};
  }
  to {
    max-height: 5rem;
    opacity: 1;
    background-color: transparent;
  }
`;

export const StyledRecentItem = styled.li<{ $fresh: boolean }>`
  overflow: hidden;
  ${({ $fresh, theme }) =>
    $fresh
      ? css`
          animation: ${arrive(theme.color["success"] as string)} 0.7s ease-out;
        `
      : ""}

  & + & {
    border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StyledRecentLine = styled.div`
  display: flex;
  align-items: stretch;
`;

export const StyledRecentExpand = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.space[2]};
  border: none;
  background: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};

  svg {
    transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    transition: transform 0.15s ease-in-out;
  }

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
    color: ${({ theme }) => theme.color["black"]};
  }
`;

export const StyledRecentRow = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  width: 100%;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledRecentName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledRecentMeta = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;
