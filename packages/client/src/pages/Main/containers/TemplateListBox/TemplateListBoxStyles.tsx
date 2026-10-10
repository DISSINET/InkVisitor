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
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding-right: ${({ theme }) => theme.space[2]};
  font-weight: ${({ theme }) => theme.fontWeight.normal};
  font-size: ${({ theme }) => theme.fontSize.lg};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledStarButtonWrap = styled.div`
  display: none;
`;

export const StyledTemplateSectionList = styled.div`
  position: relative;
  min-height: 5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;

  /* each tag is a direct child, so only the hovered one shows its buttons */
  > *:hover ${StyledStarButtonWrap} {
    display: flex;
  }
`;

export const StyledTemplateFilter = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding-right: ${({ theme }) => theme.space[2]};
`;

// shares its row with the controls next to it and shrinks with the panel
export const StyledTemplateControl = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

export const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
`;
