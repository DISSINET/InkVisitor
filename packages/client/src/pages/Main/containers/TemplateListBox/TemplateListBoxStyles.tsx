import styled from "styled-components";

export const StyledBoxContent = styled.div`
  display: block;
  overflow: auto;
  height: 100%;
  padding-bottom: 0.8rem;
  background-color: ${({ theme }) => theme.color["white"]};
`;

export const StyledTemplateSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-top: 0.3rem;
  gap: 0.5rem;
  padding-left: 0.6rem;
`;
export const StyledTemplateSectionHeader = styled.div`
  display: flex;
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledTemplateSectionList = styled.div`
  position: relative;
  min-height: 5rem;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const StyledTemplateFilter = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
`;

export const StyledTemplateFilterInputRow = styled.div`
  display: contents;
`;
export const StyledTemplateFilterInputLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["primary"]};
  white-space: nowrap;
  text-align: right;
`;
export const StyledTemplateFilterInputValue = styled.div`
  padding: ${({ theme }) => theme.space[2]};
`;

export const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
`;
