import styled from "styled-components";

export const StyledAnchorText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  /* justify-content: center; */
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
