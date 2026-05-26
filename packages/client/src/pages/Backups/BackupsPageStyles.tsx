import styled from "styled-components";

export const StyledContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;

export const StyledBoxWrap = styled.div`
  max-width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const StyledBackground = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: 2rem;
  padding: 1rem;
  border: 1px dashed ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.3);
  overflow: hidden;
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

export const StyledHeading = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[1]};
`;

export const StyledGridScrollArea = styled.div`
  padding-right: 0.5rem;
  min-height: 0;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  overflow: auto;
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(18rem, 1fr) max-content max-content max-content;
  align-items: center;
  min-width: min-content;
  margin-bottom: 0.5rem;
`;

export const StyledGridHeader = styled.div`
  display: contents;
`;

export const StyledRow = styled.div`
  display: contents;
`;

export const StyledHeaderCell = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 2.5rem;
  background: ${({ theme }) => theme.color["white"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][500]};
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  white-space: nowrap;
`;

export const StyledCell = styled.div`
  padding: 0.4rem 1rem;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  white-space: nowrap;
`;

export const StyledEmpty = styled.div`
  padding: 1rem;
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
