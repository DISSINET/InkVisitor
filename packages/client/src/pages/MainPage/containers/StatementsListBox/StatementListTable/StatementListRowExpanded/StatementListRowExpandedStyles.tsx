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
export const StyledActantGroup = styled.div`
  display: grid;
  overflow: hidden;
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
interface StyledPropRow {
  level: 1 | 2 | 3;
  disableBottomMargin?: boolean;
}
export const StyledPropRow = styled.div<StyledPropRow>`
  margin-left: ${({ level }) => getIndentation(level)};
  margin-bottom: ${({ theme, disableBottomMargin }) =>
    disableBottomMargin ? 0 : theme.space[1]};
  display: inline-flex;
  /* dislay: grid; */
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
export const StyledReferenceColumn = styled.div`
  display: grid;
`;
export const StyledPropGroupCell = styled.div`
  display: grid;
`;
