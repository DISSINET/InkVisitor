import styled from "styled-components";

export const StyledUserCustomization = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
export const StyledUserCustomizationSection = styled.div`
  display: flex;
  flex-direction: column;
`;
export const StyledRightsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
export const StyledUserRights = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  width: 28rem;
`;
export const StyledRightsHeading = styled.div`
  margin-bottom: ${({ theme }) => theme.space[2]};
  width: 100%;
  text-align: center;
`;
export const StyledUserRightHeading = styled.div`
  display: grid;
  margin-right: ${({ theme }) => theme.space[3]};
  text-align: right;
`;
export const StyledUserRightItem = styled.div`
  display: grid;
  margin-bottom: ${({ theme }) => theme.space[4]};
`;
export const StyledButtonWrap = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  margin-top: 0.5rem;
`;
