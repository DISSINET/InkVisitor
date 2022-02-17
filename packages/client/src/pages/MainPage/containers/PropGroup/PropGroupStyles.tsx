import styled from "styled-components";

export const StyledGridOld = styled.div`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[10]};
  grid-template-columns: auto auto auto;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;

export const StyledGrid = styled.div`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[10]};
  grid-template-columns: 1fr 1fr 11rem;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;
`;

export const StyledGridCell = styled.div`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
`;

interface StyledListHeaderColumn {}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

interface StyledPropLineColumn {
  padded?: boolean;
  lastSecondLevel?: boolean;
  isTag?: boolean;
}
export const StyledPropLineColumn = styled(
  StyledGridCell
)<StyledPropLineColumn>`
  display: inline-flex;
  margin-bottom: ${({ theme, lastSecondLevel }) =>
    lastSecondLevel ? theme.space[4] : theme.space[0]};
  align-items: center;
  padding-left: ${({ theme, padded }) =>
    padded ? theme.space[8] : theme.space[0]};
  padding-right: 5px;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "visible")};
  // border: 1px dashed hotpink;
`;

interface StyledPropButtonGroup {
  leftMargin?: boolean;
  rightMargin?: boolean;
  border?: boolean;
  round?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  margin-right: ${({ theme, rightMargin = true }) =>
    rightMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};

  button:disabled,
  button[disabled] {
    //background-color: ${({ theme }) => theme.color["gray"][1000]};
  }
`;
