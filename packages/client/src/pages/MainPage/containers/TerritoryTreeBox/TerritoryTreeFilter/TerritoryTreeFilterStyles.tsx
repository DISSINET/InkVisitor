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
