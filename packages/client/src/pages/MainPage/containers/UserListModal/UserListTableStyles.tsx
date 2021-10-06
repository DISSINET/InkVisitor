import styled from "styled-components";

export const StyledTable = styled.table`
  border-spacing: 0;
  border-collapse: collapse;
`;
export const StyledTHead = styled.thead`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  font-style: italic;
  font-weight: ${({ theme }) => theme.fontWeight["light"]};
  padding-bottom: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["info"]};
`;

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[2]};
    padding-right: ${({ theme }) => theme.space[2]};
  }
  td:not(:last-child) {
    width: 1%;
  }
`;

export const StyledUserNameColumn = styled.div`
  display: inline-flex;
`;
export const StyledUserNameColumnIcon = styled.div`
  font-size: 1.5em;
  margin: auto;
  margin-right: 0.5em;
`;
export const StyledUserNameColumnText = styled.div`
  * {
    display: block;
  }
`;
