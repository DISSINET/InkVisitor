import styled from "styled-components";

export const StyledContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;

interface StyledBoxWrap {}
export const StyledBoxWrap = styled.div<StyledBoxWrap>`
  /* the box spans the page; its content decides what is centred within it */
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: auto;
`;

export const StyledWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`;
