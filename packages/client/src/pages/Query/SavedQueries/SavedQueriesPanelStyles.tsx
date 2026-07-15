import styled from "styled-components";
import { FLOATING_SEARCH_COLLAPSED_SIZE } from "../FloatingSearchContainer/FloatingSearchContainerStyles";

// sits directly above the UUIDs button (see StyledIdsFloatingRoot in
// ExplorerTableStyles.tsx: bottom = 2rem + collapsed search + 1.5rem);
// this root adds one row (~2.5rem) on top of that.
export const StyledSavedQueriesRoot = styled.div`
  position: absolute;
  right: 2rem;
  bottom: calc(2rem + ${FLOATING_SEARCH_COLLAPSED_SIZE}px + 1.5rem + 2.5rem);
  z-index: 161;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
`;

export const StyledToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background-color: ${({ theme }) => theme.color.invertedBg["info"]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["info"]};
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: ${({ theme }) => theme.boxShadow.normal};
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
  background-color: ${({ theme }) => theme.color["invertedBg"]["info"]};
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

export const StyledNameInput = styled.input`
  flex: 1;
  min-width: 0;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding: 0.4rem 0.5rem;
  outline: none;
  &:focus,
  &:hover {
    border-color: ${({ theme }) => theme.color["info"]};
  }
  &::placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
  }
`;

export const StyledFolderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-height: 0;
  overflow-y: auto;
`;

export const StyledFolderHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0;
  border: none;
  background: transparent;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
  text-align: left;
`;

export const StyledFolderCount = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledQueryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  padding: 0.2rem 0.4rem 0.2rem 1.4rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
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
`;

export const StyledDeleteButton = styled.button`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.color["gray"][600]};
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledEmptyNote = styled.div`
  padding-left: 1.4rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-style: italic;
  color: ${({ theme }) => theme.color["greyer"]};
`;
