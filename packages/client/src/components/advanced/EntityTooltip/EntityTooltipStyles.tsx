import styled from "styled-components";

export const StyledContentWrap = styled.div`
  margin: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
`;

export const StyledRow = styled.div`
  display: flex;
`;
export const StyledLabel = styled.p`
  max-width: 35rem;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  word-wrap: break-word;
`;
export const StyledDetail = styled.p``;
export const StyledIconWrap = styled.span`
  margin-top: 2px;
  margin-right: ${({ theme }) => theme.space[1]};
`;
export const StyledItemsWrap = styled.div`
  margin: ${({ theme }) => theme.space[2]};
`;
// For EntityTags
export const StyledTooltipSeparator = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
