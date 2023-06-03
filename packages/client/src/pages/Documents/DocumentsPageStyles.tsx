import styled from "styled-components";

export const StyledContent = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  flex-direction: row;
`;
interface StyledBoxWrap {}
export const StyledBoxWrap = styled.div<StyledBoxWrap>`
  margin: 2rem;
  padding: 1rem;
  border: 1px dashed black;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;
export const StyledItem = styled.div`
  display: flex;
  font-size: ${({ theme }) => theme.fontSize["base"]};
  cursor: pointer;
  border: 1px dotted hotpink;
`;
