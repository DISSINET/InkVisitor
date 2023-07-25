import styled from "styled-components";

export const StyledTextWrapper = styled.div`
  white-space: nowrap;
  display: flex;
  align-items: center;
`;

export const StyledAnchorText = styled.p`
  margin-left: 0.5rem;
  display: inline-block;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 20rem;
`;
