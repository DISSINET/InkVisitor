import styled from "styled-components";

export const StyledTooltipGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  grid-auto-flow: row;
  > div:not(:last-child) {
    padding-right: 1rem;
  }
`;
export const StyledTooltipHeading = styled.p`
  font-weight: bold;
  text-decoration: underline;
  margin-bottom: 0.2rem;
`;
export const StyledTooltipColumn = styled.div``;
export const StyledEntityWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
  margin-top: 1rem;
`;
