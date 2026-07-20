import styled from "styled-components";

// query rows line up with the folder label text, not the folder card edge:
// chevron (1.4) + gap (0.3) + folder icon (1.4) + gap (0.3)
const QUERY_ROW_INDENT = "3.4rem";

// bullet gutter, subtracted from the row indent so the name text keeps landing
// on QUERY_ROW_INDENT
const QUERY_BULLET_WIDTH = "0.8rem";
const QUERY_BULLET_GAP = "0.3rem";

// upper bound for the revealed row actions (rename + delete); only caps the
// reveal animation, the group itself is sized by its icons
const QUERY_ACTIONS_WIDTH = "4rem";

// sits directly above the UUIDs button (see StyledIdsFloatingRoot in
// ExplorerTableStyles.tsx: bottom = 2rem + collapsed search + 1.5rem);
// this root adds one row (~2.5rem) on top of that.
// sits top-right; panel opens to the left of the Queries toggle button
export const StyledSavedQueriesRoot = styled.div`
  position: absolute;
  right: 2rem;
  top: 4.5rem;
  z-index: 161;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
`;

export const StyledToggleButton = styled.button<{ $isActive?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color["blue"][50]};
  box-shadow: ${({ theme, $isActive }) =>
    $isActive ? theme.boxShadow.normal : theme.boxShadow.high};
  filter: ${({ $isActive }) => ($isActive ? "brightness(0.94)" : "none")};
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["primary"]};
  transition:
    filter 0.2s,
    box-shadow 0.2s;
  &:hover {
    box-shadow: ${({ theme }) => theme.boxShadow.normal};
    filter: brightness(0.94);
  }
`;

// $maxHeight is measured from the panel's position in the viewport (see
// SavedQueriesPanel) because the panel is absolutely positioned inside a
// resizable Box, so its distance from the top of the screen is not fixed
export const StyledPanel = styled.div<{ $maxHeight?: number }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 30rem;
  max-width: calc(100vw - 4rem);
  max-height: ${({ $maxHeight }) => ($maxHeight ? `${$maxHeight}px` : "40rem")};
  min-height: 0;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  // shares its surface with the Queries toggle button, so the panel reads as
  // an extension of the control that opened it
  background-color: ${({ theme }) => theme.color["blue"][50]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  overflow: hidden;
`;

export const StyledPanelHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StyledPanelTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSize["base"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

// sits inside the name input (as its rightContent), so the cap on the name
// length is visible while typing rather than only when the input stops accepting
export const StyledCharCounter = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["greyer"]};
  padding-right: 0.2rem;
`;

export const StyledSaveRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  flex-shrink: 0;
`;

// the name field and the share toggle are both inputs to the save; the button
// that commits them sits apart from both, at the end of the reading order
export const StyledSaveFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.6rem;
`;

// sharing is a property of the query being saved rather than an action on the
// name field, so it gets a written label under the input
export const StyledShareRow = styled.div`
  display: inline-flex;
  align-items: center;
  padding-left: 0.2rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

// keeps the button right-aligned whether or not the share toggle is rendered
// (viewers cannot share, so that control is absent for them)
export const StyledSaveAction = styled.div`
  display: inline-flex;
  margin-left: auto;
`;

// takes whatever height the panel has left once the header and save area are
// laid out, and scrolls internally instead of pushing the panel taller
export const StyledFolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

// each folder sits in its own card so the groups read as separate containers
// resting on the tinted panel background (white flips in the dark theme)
export const StyledFolderCard = styled.div`
  flex-shrink: 0;
  padding: 0.4rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.color["gray"][200]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledFolderHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  width: 100%;
  padding: 0.2rem 0;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["greyer"]};
  cursor: pointer;
  text-align: left;
`;

export const StyledChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
  transform: rotate(${({ $open }) => ($open ? "90deg" : "0deg")});
  transition: transform 0.2s ease;
`;

export const StyledFolderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.4rem;
  height: 1.4rem;
`;

export const StyledFolderCount = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledLockIcon = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["greyer"]};
`;

// names can wrap to two lines, so rows are top-aligned (bullet and actions line
// up with the first line) and the bullet sits in the indent gutter, keeping the
// name text itself aligned with the folder label above it
export const StyledQueryRow = styled.div<{ $editing?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${QUERY_BULLET_GAP};
  padding: 0.2rem 0.4rem 0.2rem
    calc(${QUERY_ROW_INDENT} - ${QUERY_BULLET_WIDTH} - ${QUERY_BULLET_GAP});
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme, $editing }) =>
    $editing ? theme.color["gray"][200] : "transparent"};
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

// query names can get long (they describe the whole query), so the label wraps
// to two lines before it truncates — the name input is capped (see
// QUERY_NAME_MAX_LENGTH) so two lines cover nearly every name
export const StyledQueryBullet = styled.span`
  flex-shrink: 0;
  width: ${QUERY_BULLET_WIDTH};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  line-height: 1.4;
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledQueryName = styled.button`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  text-overflow: ellipsis;
  border: none;
  background: transparent;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  line-height: 1.4;
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
  padding: 0;
  outline: none;
`;

// collapsed to zero width (not merely transparent) while idle, so the name gets
// the full row and only gives the space back once the actions are revealed
export const StyledQueryActions = styled.div<{ $forceVisible?: boolean }>`
  display: inline-flex;
  align-items: center;
  // the row is top-aligned for the bullet's sake; the actions belong to the
  // whole row, so they centre against however many lines the name takes
  align-self: center;
  gap: 0.4rem;
  flex-shrink: 0;
  max-width: ${({ $forceVisible }) => ($forceVisible ? QUERY_ACTIONS_WIDTH : "0")};
  overflow: hidden;
  opacity: ${({ $forceVisible }) => ($forceVisible ? 1 : 0)};
  pointer-events: ${({ $forceVisible }) => ($forceVisible ? "auto" : "none")};
  transition:
    max-width 0.15s ease,
    opacity 0.15s ease;

  ${StyledQueryRow}:hover & {
    max-width: ${QUERY_ACTIONS_WIDTH};
    opacity: 1;
    pointer-events: auto;
  }
`;

export const StyledQueryActionButton = styled.button<{ $danger?: boolean }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  &:hover {
    color: ${({ theme, $danger }) => ($danger ? theme.color["danger"] : theme.color["info"])};
  }
`;

export const StyledEmptyNote = styled.div`
  padding: 0.2rem 0 0.2rem ${QUERY_ROW_INDENT};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
`;
