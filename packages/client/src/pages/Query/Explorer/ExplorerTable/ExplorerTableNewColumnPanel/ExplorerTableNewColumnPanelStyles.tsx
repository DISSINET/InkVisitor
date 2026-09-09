import styled from "styled-components";

/* New column panel */
export const StyledPanel = styled.div`
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  width: 36rem;
  max-width: calc(100% - 2rem);
  max-height: calc(100% - 2rem);
  overflow: auto;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 1rem;
  z-index: 150;
  background-color: ${({ theme }) => theme.color.blue[100]};
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
  grid-template-columns: 8rem 1fr;
  grid-auto-rows: minmax(28px, auto);
  gap: 0.5rem 0.5rem;
`;
export const StyledLabel = styled.div`
  display: grid;
  align-items: center;
  color: ${({ theme }) => theme.color.black};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledValue = styled.div`
  display: grid;
  align-items: center;
  color: ${({ theme }) => theme.color.black};
`;

/** Holds the fill-from-type-label button inside the column name input. */
export const StyledNameFillWrap = styled.div`
  display: flex;
  align-items: center;
  margin-left: 0.2rem;
`;

export const StyledCloseIconWrap = styled.span`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  height: 2.5rem;
  width: 2.5rem;
  padding: 0.3rem;
  cursor: pointer;
  border-radius: 5rem;
  transition: 0.3s;

  &:hover {
    background-color: ${({ theme }) => theme.color.closeBtnBackground};
  }
`;
