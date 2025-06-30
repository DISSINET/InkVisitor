import styled from "styled-components";

export const StyledContentWrap = styled.div`
  margin: ${({ theme }) => `${theme.space[2]} ${theme.space[3]}`};
`;

export const StyledRow = styled.div`
  display: flex;
`;

export const StyledLabel = styled.p`
  max-width: 35rem;
  word-wrap: break-word;
`;

export const StyledBold = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;

export const StyledDetail = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledIconWrap = styled.span`
  margin-top: 2px;
  margin-right: ${({ theme }) => theme.space[1]};
`;

export const StyledItemsWrap = styled.div`
  margin: ${({ theme }) => theme.space[2]};
`;

export const StyledRelations = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: ${({ theme }) => theme.space[5]};
  margin-top: 1rem;
  padding-bottom: ${({ theme }) => theme.space[1]};
  vertical-align: middle;
`;

export const StyledRelationTypeBlock = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.space[2]};
  margin-top: 5px;
`;

export const StyledLetterIconWrap = styled.div`
  display: grid;
  justify-content: center;
`;

export const StyledAnchorItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledAnchorText = styled.div`
  color: ${({ theme }) => theme.color["tooltipColor"]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-family: mono;
  padding-left: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
`;

export const StyledAnchorEmptyState = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-style: italic;
  text-align: center;
`;
