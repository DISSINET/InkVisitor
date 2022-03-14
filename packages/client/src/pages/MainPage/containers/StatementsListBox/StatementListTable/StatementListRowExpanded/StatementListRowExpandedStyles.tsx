import styled from "styled-components";
import theme from "Theme/theme";

export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledSubRowTd = styled.div`
  display: table-cell;
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledActantGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
interface StyledPropRow {
  level: 1 | 2 | 3;
}

const getIndentation = (level: 1 | 2 | 3) => {
  switch (level) {
    case 1:
      return theme.space[2];
    case 2:
      return theme.space[8];
    case 3:
      return theme.space[14];
  }
};

export const StyledPropRow = styled.div<StyledPropRow>`
  margin-left: ${({ level }) => getIndentation(level)};
  margin-bottom: ${({ theme }) => theme.space[2]};
  display: flex;
  border: 1px dashed black;
`;
export const StyledPropGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledActantWrap = styled.div`
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
