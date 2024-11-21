import styled from "styled-components";

export const StyledValidationList = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 1.5rem;
`;
export const StyledBlockSeparator = styled.div`
  width: 100%;
  grid-column: span 2;
  border-top: 1px dashed grey;
`;
export const StyledToggleWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.color["info"]};
`;
