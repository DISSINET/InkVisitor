import styled from "styled-components";

export const StyledFilterWrap = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${({ theme }) => theme.space[2]};
`;
export const StyledFilterList = styled.div`
  margin: 0.3rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
export const StyledCancelButton = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.space[2]};
  top: 4px;
  svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledInputWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0 0.4rem;
`;
