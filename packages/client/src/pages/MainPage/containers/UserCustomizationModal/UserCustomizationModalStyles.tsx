import styled from "styled-components";

export const StyledRightsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
`;
export const StyledUserRights = styled.div`
  margin-top: ${({ theme }) => theme.space[2]};

  display: grid;
  grid-template-columns: auto auto;
`;
export const StyledRightsHeading = styled.div`
  margin-top: ${({ theme }) => theme.space[4]};
  width: 100%;
  text-align: center;
`;
