import styled from "styled-components";

interface StyledActantHeaderRow {
  type: string;
}
export const StyledActantHeaderRow = styled.div<StyledActantHeaderRow>`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding-bottom: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[6]};
  padding-left: ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.color["gray"][200]};
  border-left: 3px solid;
  border-left-color: ${({ theme, type }) => theme.color["entity" + type]};
`;
export const StyledTagWrap = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[4]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
