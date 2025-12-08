import styled from "styled-components";

/* New column panel */
export const StyledPanel = styled.div`
  position: fixed;
  right: 3rem;
  bottom: 3rem;
  width: 360px;
  background: #ccc5b9;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 1rem;
  z-index: 900;
  background-color: ${({ theme }) => theme.color.blue[100]};

  /* opacity: 0.8;
  transition: opacity 0.2s ease-in-out;
  &:hover {
    opacity: 1;
  } */
`;
export const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: ${({ theme }) => theme.color.black};
`;
export const StyledContent = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  grid-auto-rows: minmax(28px, auto);
  gap: 0.5rem 0.5rem;
`;
export const StyledLabel = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color.black};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledValue = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color.black};
`;
