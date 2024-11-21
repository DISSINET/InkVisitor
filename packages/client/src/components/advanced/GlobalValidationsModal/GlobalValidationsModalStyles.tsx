import styled from "styled-components";

export const StyledGridForm = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
  margin-top: 0.5rem;
  margin-left: 0.8rem;
  margin-bottom: 2.5rem;
`;
export const StyledGridFormLabel = styled.div`
  display: grid;
  justify-content: end;
  align-items: center;
`;
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
