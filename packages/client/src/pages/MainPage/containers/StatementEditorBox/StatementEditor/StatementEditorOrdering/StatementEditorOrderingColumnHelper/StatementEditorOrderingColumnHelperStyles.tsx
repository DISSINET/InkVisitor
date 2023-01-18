import styled from "styled-components";

export const StyledMainColumn = styled.div`
  white-space: nowrap;
  display: flex;
`;
export const StyledInfoColumn = styled.div`
  text-align: right;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
`;
export const StyledTableTextGridCell = styled.div`
  display: grid;
  overflow: hidden;
  font-size: inherit;
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledSeparator = styled.div`
  width: ${({ theme }) => theme.space[1]};
`;
export const StyledInfoText = styled.div`
  margin-bottom: 0.1rem;
`;
