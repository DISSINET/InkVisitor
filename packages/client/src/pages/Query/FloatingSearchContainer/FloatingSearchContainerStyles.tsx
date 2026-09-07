import styled from "styled-components";

export const FLOATING_SEARCH_COLLAPSED_SIZE = 48;
export const FLOATING_SEARCH_EXPANDED_WIDTH = 280;
export const FLOATING_SEARCH_PAGE_PADDING = 16;

interface StyledFloatingRootProps {
  $left: number;
  $top: number;
}
export const StyledFloatingRoot = styled.div<StyledFloatingRootProps>`
  position: absolute;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  z-index: 164;
`;

// anchors the round button together with its badge and clear control; the
// satellites cannot live inside the button itself because a button may not
// contain another button
export const StyledCollapsedRoot = styled.div`
  position: absolute;
  right: 2rem;
  bottom: 2rem;
  width: ${FLOATING_SEARCH_COLLAPSED_SIZE}px;
  height: ${FLOATING_SEARCH_COLLAPSED_SIZE}px;
  z-index: 162;
`;

export const StyledCollapsedButton = styled.button<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.color.primary};
  background-color: ${({ theme, $isActive }) =>
    $isActive ? theme.color.blue[150] : theme.color.blue[100]};
  box-shadow: ${({ theme, $isActive }) =>
    $isActive ? theme.boxShadow.normal : theme.boxShadow.high};
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.color.blue[150]};
    box-shadow: ${({ theme }) => theme.boxShadow.normal};
  }
`;

// Count of filters still applied while the panel is minimised — the filters keep
// affecting results once the panel is out of sight, so the button has to say so.
// It doubles as the control that drops them: hovering swaps the count for a
// cross in place, which keeps a single small target on the round button.
export const StyledFilterCountBadge = styled.button`
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.8rem;
  height: 1.8rem;
  padding: 0 0.4rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color.info};
  color: ${({ theme }) => theme.color.white};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.color.danger};
  }
`;

export const StyledBadgeCount = styled.span`
  transition: opacity 0.15s;

  ${StyledFilterCountBadge}:hover &,
  ${StyledFilterCountBadge}:focus-visible & {
    opacity: 0;
  }
`;

export const StyledBadgeClearIcon = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;

  ${StyledFilterCountBadge}:hover &,
  ${StyledFilterCountBadge}:focus-visible & {
    opacity: 1;
  }
`;

// count of applied filters shown in the panel header, with the control that
// drops them - lets the filters be cleared without also closing the panel
export const StyledFilterSummary = styled.span`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color.gray[600]};
`;

export const StyledClearFiltersButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color.info};
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color.danger};
  }
`;

export const StyledHeaderButtons = styled.span`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledExpandedPanel = styled.div<{ $maxHeight?: number }>`
  display: flex;
  flex-direction: column;
  width: ${FLOATING_SEARCH_EXPANDED_WIDTH}px;
  max-width: calc(100vw - ${FLOATING_SEARCH_PAGE_PADDING * 2}px);
  // the form is taller than the page at large zoom levels; the panel stops at
  // the page bounds and its content scrolls instead of running off screen
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : "none")};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  overflow: hidden;
`;

export const StyledExpandedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]};
  margin-left: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.color.blue[150]};
  color: ${({ theme }) => theme.color.primary};
`;

export const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex: 1;
  min-width: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color.gray[600]};

  &:active {
    cursor: grabbing;
  }
`;

export const StyledExpandedContent = styled.div`
  padding: ${({ theme }) => theme.space[3]};
  // a flex child scrolls only once it may shrink below its content
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

export const StyledCloseButtonWrap = styled.span`
  display: flex;
  flex-shrink: 0;
`;
