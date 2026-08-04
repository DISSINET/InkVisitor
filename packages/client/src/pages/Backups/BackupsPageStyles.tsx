import styled from "styled-components";

/**
 * Box body. The table is as wide as its columns need and sits in the middle of
 * the box, vertically centered with it - a handful of backups reads at eye
 * level instead of clinging to the top of a tall box.
 */
export const StyledBackupsContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]};
`;

/**
 * Column holding the table at one width. The white surface stops at its edges -
 * the box around it stays page background. Positioned, so the download overlay
 * covers the surface rather than the whole box.
 */
export const StyledBackupsColumn = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: fit-content;
  max-width: 100%;
  min-height: 0;
  padding: ${({ theme }) => theme.space[4]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledDownloadOverlay = styled.div<{ $show: boolean }>`
  display: ${({ $show }) => ($show ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  position: absolute;
  inset: 0;
  z-index: 25;
  background-color: ${({ theme }) => theme.color.backupDownloadOverlay};
`;

export const StyledDownloadOverlayPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
`;

export const StyledDownloadOverlayLabel = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  text-align: center;
`;

export const StyledDownloadOverlayLink = styled.a`
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-family: monospace;
  text-decoration: underline;
  word-break: break-all;
  max-width: 32rem;
  text-align: center;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
`;

/** Grows only as far as the rows need, then scrolls within what is left */
export const StyledGridScrollArea = styled.div`
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow: auto;
`;

/** The file name is the download control, so the row needs no action column */
export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) max-content max-content;
  // cells stretch to the full row height so a row-wide fill has no gaps; each
  // cell centers its own content vertically
  align-items: stretch;
  min-width: min-content;
  margin-bottom: 0.5rem;
`;

export const StyledGridHeader = styled.div`
  display: contents;
`;

/**
 * Cells are grid items of the shared grid, so the row itself lays out nothing
 * and the hover fill has to be painted on the cells it contains.
 */
export const StyledRow = styled.div`
  display: contents;

  &:hover > * {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }

  &:hover > *:first-child {
    border-top-left-radius: ${({ theme }) => theme.borderRadius["default"]};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius["default"]};
  }

  &:hover > *:last-child {
    border-top-right-radius: ${({ theme }) => theme.borderRadius["default"]};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius["default"]};
  }
`;

export const StyledHeaderCell = styled.div<{ $alignRight?: boolean }>`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: ${({ $alignRight }) => ($alignRight ? "flex-end" : "flex-start")};
  min-height: 2.5rem;
  background: ${({ theme }) => theme.color["white"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  white-space: nowrap;
`;

export const StyledCell = styled.div<{ $alignRight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $alignRight }) => ($alignRight ? "flex-end" : "flex-start")};
  padding: 0.4rem 1rem;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  white-space: nowrap;
`;

/**
 * File name cell: the whole name downloads the archive it names. Blocked by
 * aria-disabled rather than the disabled attribute - a disabled button takes
 * no pointer events, so its title tooltip never opens to say why it is dead.
 */
export const StyledDownloadLink = styled.button<{ $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin: 0;
  padding: 0.4rem 1rem;
  border: none;
  background: none;
  color: ${({ theme }) => theme.color["info"]};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  text-align: left;
  text-decoration: underline;
  white-space: nowrap;
  // a download in flight blocks the others; the row stays readable but dead
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};

  &:hover {
    text-decoration-thickness: ${({ $disabled }) => ($disabled ? "auto" : "2px")};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["info"]};
    outline-offset: -2px;
  }
`;

/** The date folder identifies the archive - every file below it has one name */
export const StyledBackupId = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

export const StyledBackupFileName = styled.span`
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  text-decoration: none;
`;

export const StyledEmpty = styled.div`
  padding: 1rem;
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
