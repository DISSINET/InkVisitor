import styled from "styled-components";

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
  background-color: ${({ theme }) => theme.color.invertedBg["primary"]};
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

export const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 30rem;
  max-width: calc(100vw - 4rem);
  max-height: 40rem;
  min-height: 0;
  padding: 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.color["invertedBg"]["primary"]};
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
  font-size: ${({ theme }) => theme.fontSize["sm"]};
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

export const StyledSaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const StyledFolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
  overflow-y: auto;
`;

// each folder sits in its own framed card so the groups read as separate
// containers against the panel background (white flips in the dark theme)
export const StyledFolderCard = styled.div`
  flex-shrink: 0;
  padding: 0.3rem 0.4rem;
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
  color: ${({ theme }) => theme.color["black"]};
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

export const StyledQueryRow = styled.div<{ $editing?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  padding: 0.2rem 0.4rem 0.2rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme, $editing }) =>
    $editing ? theme.color["gray"][200] : "transparent"};
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

export const StyledQueryName = styled.button`
  display: flex;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border: none;
  background: transparent;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
  padding: 0;
  outline: none;
`;

export const StyledQueryActions = styled.div<{ $forceVisible?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
  opacity: ${({ $forceVisible }) => ($forceVisible ? 1 : 0)};
  pointer-events: ${({ $forceVisible }) => ($forceVisible ? "auto" : "none")};
  transition: opacity 0.15s ease;

  ${StyledQueryRow}:hover & {
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
    color: ${({ theme, $danger }) =>
      $danger ? theme.color["danger"] : theme.color["info"]};
  }
`;

export const StyledEmptyNote = styled.div`
  padding: 0 0 0.2rem 1.4rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
`;
