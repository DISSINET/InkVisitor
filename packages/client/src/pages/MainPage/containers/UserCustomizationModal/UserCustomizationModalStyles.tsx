import styled from "styled-components";

export const StyledRightsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
export const StyledUserRights = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  margin-top: ${({ theme }) => theme.space[2]};
  width: 28rem;
`;
export const StyledRightsHeading = styled.div`
  margin-top: ${({ theme }) => theme.space[4]};
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
