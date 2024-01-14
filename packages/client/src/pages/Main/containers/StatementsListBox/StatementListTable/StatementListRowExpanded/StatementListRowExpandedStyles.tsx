import { BsArrowReturnRight } from "react-icons/bs";
import styled from "styled-components";
import theme from "Theme/theme";

export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[8]};
  padding-left: ${({ theme }) => `${theme.space[6]}`};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
`;

const getIndentation = (level: 1 | 2 | 3) => {
  switch (level) {
    case 1:
      return theme.space[5];
    case 2:
      return theme.space[10];
    case 3:
      return theme.space[16];
  }
};
interface StyledPropGridRow {
  level: 1 | 2 | 3;
  disableBottomMargin?: boolean;
}
export const StyledPropGridRow = styled.div<StyledPropGridRow>`
  margin-left: ${({ level }) => getIndentation(level)};
  margin-bottom: ${({ theme, disableBottomMargin }) =>
    disableBottomMargin ? 0 : theme.space[1]};
  display: grid;
  grid-template-columns: auto auto;
  overflow: hidden;
`;
interface StyledPropRow {
  disableBottomMargin?: boolean;
}
export const StyledPropRow = styled.div<StyledPropRow>`
  margin-left: ${({ theme }) => theme.space[5]};
  margin-bottom: ${({ theme, disableBottomMargin }) =>
    disableBottomMargin ? 0 : theme.space[1]};
  display: inline-flex;
  overflow: hidden;
`;

export const StyledPropGroup = styled.div`
  display: flex;
  overflow: hidden;
  flex-direction: column;
`;
export const StyledActantWrap = styled.div`
  width: 100%;
  display: inline-flex;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
export const StyledActantWithPropsWrap = styled.div`
  max-width: 100%;
  display: inline-flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledExpandedRowTd = styled.td``;
export const StyledExpandedRowTr = styled.tr`
  width: 100%;
`;
export const StyledSpan = styled.span`
  margin-top: 2px;
`;
export const StyledBsArrowReturnRight = styled(BsArrowReturnRight)`
  margin-top: -2px;
  flex-shrink: 0;
`;
export const StyledReferenceSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledNoteWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
export const StyledNotesSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
export const StyledReferenceRow = styled.div`
  max-width: 100%;
  display: grid;
  grid-template-columns: auto auto;
`;
interface StyledReferenceColumn {
  marginRight?: boolean;
}
export const StyledReferenceColumn = styled.div<StyledReferenceColumn>`
  display: grid;
  margin-right: ${({ theme, marginRight }) =>
    marginRight ? theme.space[1] : ""};
`;
interface StyledTagWrap {
  marginRight?: boolean;
}
export const StyledTagWrap = styled.div<StyledTagWrap>`
  display: inline-flex;
  overflow: hidden;
  margin-right: ${({ theme, marginRight }) =>
    marginRight ? theme.space[1] : ""};
`;
export const StyledGrid = styled.div`
  display: grid;
`;
