import styled from "styled-components";

export const StyledHeading = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
`;
export const StyledTagWrapper = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-flex;
  overflow: hidden;
  max-width: 100%;
`;
