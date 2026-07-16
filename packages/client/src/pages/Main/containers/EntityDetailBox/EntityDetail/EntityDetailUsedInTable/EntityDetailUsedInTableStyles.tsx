import styled from "styled-components";

export const StyledTableTextGridCell = styled.div`
  display: grid;
  overflow: hidden;
  font-size: inherit;
`;
export const StyledShortenedText = styled.div<{ $italic?: boolean }>`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: inherit;
  font-style: ${({ $italic }) => ($italic ? "italic" : "normal")};
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledDots = styled.div`
  display: flex;
  align-items: flex-end;
  cursor: default;
`;
