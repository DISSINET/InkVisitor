import styled from "styled-components";

export const StyledApplyTemplate = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;
export const StyledUsedAsSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
`;
export const StyledUsedAsHeading = styled.div`
  color: ${({ theme }) => theme.color["info"]};
  margin-bottom: 0.3rem;
`;
export const StyledTagList = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledTagWrap = styled.div`
  display: inline-grid;
  margin-bottom: 0.3rem;
`;
