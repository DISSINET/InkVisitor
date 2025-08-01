import styled from "styled-components";

export const StyledSearchCancelButton = styled.div`
  position: absolute;
  right: 0.25rem;
  top: 4px;
  svg {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;
