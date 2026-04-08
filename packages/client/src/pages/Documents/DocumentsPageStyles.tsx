import styled from "styled-components";
import { StyledScrollbar } from "components/basic/CustomScrollbar/CustomScrollbarStyles";

/**
 * Documents grid can scroll on both axes; the library’s gutter margin/padding can break horizontal extent.
 * Neutralize that here only (shared CustomScrollbar stays unchanged) and hide the *native* overflow
 * scrollbar on the scroller so only the custom tracks show.
 */
export const DocumentsStyledScrollbar = styled(StyledScrollbar)`
  .ScrollbarsCustom-Scroller {
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 0 !important;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }
  }
`;

export const StyledContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;
interface StyledBoxWrap {}
export const StyledBoxWrap = styled.div<StyledBoxWrap>`
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
export const StyledBackground = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin: 2rem;
  padding: 1rem;
  padding-right: 0.1rem;
  border: 1px dashed ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

export const StyledGridScrollArea = styled.div`
  flex: 1;
  min-height: 0;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-self: stretch;
`;

export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr repeat(3, auto);
  align-items: center;
  min-width: min-content;
  margin-bottom: 0.5rem;
  padding-right: 0.5rem;
`;

export const StyledTitleWrap = styled.div`
  min-width: 18rem;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: 0 1rem 0 0.8rem;
`;
export const StyledTitle = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  max-width: 100%;
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  padding: 0.3rem 0;
`;
export const StyledReference = styled.div`
  display: grid;
  max-width: 17.4rem;
  position: relative;
  padding: 0.2rem 1rem;
`;
export const StyledHeading = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[1]};
`;
export const StyledCount = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: inline-flex;
  gap: 0.5rem;
  white-space: nowrap;
`;

export const StyledCountTag = styled.div`
  padding: 2px 6px;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: default;
`;

export const StyledInputWrap = styled.div`
  color: ${({ theme }) => theme.color["black"]};
  height: 5rem;
  min-width: 40rem;
  margin-top: 1rem;
  padding: 0.3rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  background: ${({ theme }) => `
    repeating-linear-gradient(
    -45deg,
    ${theme.color.white},
    ${theme.color.white},
    2px,
    ${theme.color.uploadDocumentBg} 1px,
    ${theme.color.uploadDocumentBg} 12px
  )
  `};
`;
