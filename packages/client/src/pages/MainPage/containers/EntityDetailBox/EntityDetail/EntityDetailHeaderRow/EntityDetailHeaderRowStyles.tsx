import styled from "styled-components";

interface StyledActantHeaderRow {}
export const StyledActantHeaderRow = styled.div<StyledActantHeaderRow>`
  display: flex;
  width: 100%;
  padding-bottom: ${({ theme }) => theme.space[3]};
  padding-right: ${({ theme }) => theme.space[6]};
  padding-left: ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.color["gray"][200]};
`;
export const StyledTagWrap = styled.div`
  margin-right: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[4]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
