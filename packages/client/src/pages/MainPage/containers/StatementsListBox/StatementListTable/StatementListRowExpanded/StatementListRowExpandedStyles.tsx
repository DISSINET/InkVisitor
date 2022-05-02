import { BsArrowReturnRight } from "react-icons/bs";
import styled from "styled-components";
import theme from "Theme/theme";

export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  margin-left: ${({ theme }) => `${theme.space[6]}`};
  /* background-color: ${({ theme }) => theme.color["gray"][200]}; */
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  max-width: 550px;
`;
export const StyledActantGroup = styled.div`
  display: flex;
  overflow: hidden;
  flex-direction: column;
`;
interface StyledPropRow {
  level: 1 | 2 | 3;
}

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

export const StyledPropRow = styled.div<StyledPropRow>`
  margin-left: ${({ level }) => getIndentation(level)};
  margin-bottom: ${({ theme }) => theme.space[2]};
  display: inline-flex;
  overflow: hidden;
`;
export const StyledGridCell = styled.div`
  display: inline-flex;
  overflow: hidden;
  max-width: 250px;
`;
export const StyledPropGroup = styled.div`
  display: flex;
  overflow: hidden;
  flex-direction: column;
`;
export const StyledActantWrap = styled.div`
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledReferenceWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
  div {
    padding-right: ${({ theme }) => theme.space[1]};
  }
`;

export const StyledExpandedRowTd = styled.td`
  background-color: pink;
`;
export const StyledExpandedRowTr = styled.tr`
  width: 100%;
  background-color: hotpink;
`;
export const StyledSpan = styled.span`
  margin-top: 2px;
`;
export const StyledBsArrowReturnRight = styled(BsArrowReturnRight)`
  margin-top: -2px;
`;
export const StyledNoteWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
