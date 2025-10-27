import styled from "styled-components";

export const StyledTableContainer = styled.div<{
  $height: number;
  $width: number;
}>`
  width: ${(props) => props.$width}px;
  height: ${(props) => props.$height}px;
  overflow: auto;
  border: 1px solid ${(props) => props.theme.color.gray[200]};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

export const StyledTable = styled.table<{ $width: number }>`
  border-collapse: collapse;
  width: ${(props) => props.$width}px;
  table-layout: fixed;
`;

export const StyledTh = styled.th<{ $isSticky?: boolean }>`
  background: ${(props) => props.theme.color.gray[100]};
  padding: ${(props) => props.theme.space[2]};
  text-align: left;
  font-weight: ${(props) => props.theme.fontWeight.bold};
  border-bottom: 2px solid ${(props) => props.theme.color.gray[200]};
  white-space: nowrap;
  font-size: 14px;
  width: 150px;
  position: sticky;
  top: 0;
  z-index: 1;
  ${(props) =>
    props.$isSticky &&
    `
    left: 0;
    z-index: 2;
    `}
`;

export const StyledTd = styled.td<{ $isSticky?: boolean }>`
  padding: ${(props) => props.theme.space[2]};
  border-bottom: 1px solid ${(props) => props.theme.color.gray[200]};
  width: 100px;
  font-size: 13px;

  ${(props) =>
    props.$isSticky &&
    `
    position: sticky;
    left: 0;
    background: ${props.theme.color.gray[100]};
    z-index: 1;
    font-weight: ${props.theme.fontWeight.bold};
    `}
`;
