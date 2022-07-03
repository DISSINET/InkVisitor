import styled from "styled-components";

export const StyledTabGroup = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 2px;
  /* overflow: auto; */
  /* height: 3rem; */
`;

export const StyledDetailContentRow = styled.div``;

export const StyledDetailContentRowLabel = styled.div`
  float: left;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledDetailContentRowValue = styled.div`
  float: right;
`;

export const StyledDetailForm = styled.div`
  display: table;
  width: 100%;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.space[6]};
  ${StyledDetailContentRow} {
    display: table-row;
    width: 100%;
    ${StyledDetailContentRowLabel} {
      width: 1%;
      white-space: nowrap;
      display: table-cell;
      padding: ${({ theme }) => theme.space[3]};
      vertical-align: top;
      text-align: right;
      float: initial;
    }
    ${StyledDetailContentRowValue} {
      display: table-cell;
      width: 100%;
      padding: ${({ theme }) => theme.space[2]};
    }
  }
`;
