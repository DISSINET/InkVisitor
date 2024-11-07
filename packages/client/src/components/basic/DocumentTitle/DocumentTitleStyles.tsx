import styled from "styled-components";

export const StyledDocumentTag = styled.div`
  display: inline-flex;
  margin: 0 0.6rem;
  background-color: ${({ theme }) => theme.color["blue"][400]};
  padding: ${({ theme }) => theme.space[1] + " " + theme.space[3]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  color: white;
  font-size: small;
  align-items: center;
`;

export const StyledDocumentTitle = styled.p`
  display: inline-block;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
`;
