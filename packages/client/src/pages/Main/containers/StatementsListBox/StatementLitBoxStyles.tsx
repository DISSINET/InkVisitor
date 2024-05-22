import styled from "styled-components";

export const StyledDots = styled.p`
  display: flex;
  align-items: flex-end;
  margin-left: ${({ theme }) => theme.space[1]};
  cursor: default;
`;

export const StyledLoaderWrap = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledSelectorCell = styled.div`
  cursor: pointer;
  margin: -0.5em 0em;
`;

export const StyledActionLabel = styled.div`
  font-size: 90%;
  max-width: 12em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
export const StyledTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex-shrink: 0;
`;
export const StyledEmptyState = styled.div`
  padding: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  display: flex;
  align-self: center;
  align-items: center;
  text-align: center;
`;

export const StyledDocumentTag = styled.div`
  display: inline-flex;
  margin: 0 0.6rem;
  background-color: ${({ theme }) => theme.color["blue"][400]};
  padding: ${({ theme }) => theme.space[1] + " " + theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  color: white;
  font-size: small;
  align-items: center;
`;

interface StyledDocumentInfoProps {
  $color?: string;
}
export const StyledDocumentInfo = styled.div<StyledDocumentInfoProps>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  color: ${({ theme, $color }) => theme.color[$color || "black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledDocumentTitle = styled.p`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
`;
