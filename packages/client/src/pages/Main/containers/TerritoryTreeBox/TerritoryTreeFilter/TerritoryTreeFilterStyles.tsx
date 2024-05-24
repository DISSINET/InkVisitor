import styled from "styled-components";

export const StyledFilterWrap = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledFilterList = styled.div`
  display: flex;
  flex-direction: column;
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
  gap: 0 4px;
`;
