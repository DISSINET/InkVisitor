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
  background-color: ${({ theme }) => theme.color["white"]};
  width: 45rem;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: auto;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.3);
`;
export const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr repeat(3, auto);
  align-items: center;
`;

export const StyledTitle = styled.div`
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  padding: 0 1rem 0 0.8rem;
`;
export const StyledReference = styled.div`
  padding: 0 1rem;
`;
export const StyledHeading = styled.div`
  font-size: ${({ theme }) => theme.fontSize["lg"]};
  text-decoration: underline;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;
