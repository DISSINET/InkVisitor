import styled from "styled-components";

export const StyledRelation = styled.div`
  display: flex;
  flex-wrap: wrap;
  /* border-bottom: 1px solid black; */
`;
export const StyledEntityWrapper = styled.div`
  display: flex;
  margin-right: ${({ theme }) => theme.space[1]};
  margin-bottom: ${({ theme }) => theme.space[1]};
`;
export const StyledCloudEntityWrapper = styled.div`
  display: flex;
  margin: ${({ theme }) => theme.space[1]};
`;
