import styled from "styled-components";

export const StyledTableTextGridCell = styled.div`
  display: grid;
  max-width: 100%;
  overflow: hidden;
  font-size: inherit;
`;

export const StyledShortenedText = styled.div`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: inherit;
`;
