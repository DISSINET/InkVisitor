import styled from "styled-components";

export const StyledAnchorText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  /* justify-content: center; */
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;

export const StyledAbbreviatedLabel = styled.div`
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
`;
