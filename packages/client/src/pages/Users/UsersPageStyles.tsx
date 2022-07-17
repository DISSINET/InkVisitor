import styled from "styled-components";

interface StyledContent {}
export const StyledContent = styled.div<StyledContent>`
  width: 100%;
  width: 120rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const StyledWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
