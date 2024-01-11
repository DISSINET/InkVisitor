import styled from "styled-components";

export const StyledRelationType = styled.div`
  display: flex;
  flex-direction: row;

  > * {
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledArrow = styled.span`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["info"]};
`;
