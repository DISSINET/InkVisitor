import styled from "styled-components";

export const StyledTextWrapper = styled.div`
  display: inline-flex;
  margin: 0 0.6rem;
  padding: ${({ theme }) => theme.space[1] + " " + theme.space[3]};
  font-size: small;
  align-items: center;
`;

export const StyledText = styled.p`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.color["black"]};
`;
