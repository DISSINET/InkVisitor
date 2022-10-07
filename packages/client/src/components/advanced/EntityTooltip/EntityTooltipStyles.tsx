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
export const StyledLoaderWrap = styled.div`
  position: relative;
  height: 3rem;
`;

export const StyledRelations = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  margin-top: 1rem;
  /* border: 1px dotted white; */
`;
export const StyledRelationTypeBlock = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[5]};
  /* border: 1px dashed blue; */
`;
export const StyledRelationTypeTreeBlock = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[5]};
  border: 1px dashed white;
  width: 30rem;
`;
export const StyledTreeBlock = styled.div`
  border-bottom: 1px solid white;
  width: 100%;
`;
export const StyledFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  /* TODO: solve thirds */
`;
export const StyledFlexRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;
export const StyledGridRowThird = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  width: 100%;
`;
export const StyledGridRowHalf = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
`;

export const StyledLetterIconWrap = styled.div`
  display: grid;
  justify-content: center;
  /* border: 1px dashed pink; */
`;
