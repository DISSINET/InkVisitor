import styled from "styled-components";

interface StyledEntityTagWrap {
  $flexListMargin: boolean;
}
export const StyledEntityTagWrap = styled.div<StyledEntityTagWrap>`
  display: inline-flex;
  overflow: hidden;
  margin-right: ${({ $flexListMargin }) => ($flexListMargin ? "0.5rem" : "")};
  margin-bottom: ${({ $flexListMargin }) => ($flexListMargin ? "0.5rem" : "")};
`;
