import styled from "styled-components";

const getBlockWidth = (depth?: number) => {
  switch (depth) {
    case 1:
      return "10rem";
    case 2:
      return "20rem";
    case 3:
      return "30rem";
    default:
      return "30rem";
  }
};
interface StyledRelationTypeTreeBlock {
  depth?: number;
}
export const StyledRelationTypeTreeBlock = styled.div<StyledRelationTypeTreeBlock>`
  display: flex;
  flex-direction: column;
  margin-left: ${({ theme }) => theme.space[2]};
  border: 1px solid;
  border-color: ${({ theme }) => theme.color["white"]};
  width: ${({ depth }) => getBlockWidth(depth)};
`;
export const StyledTreeBlock = styled.div`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.color["white"]};
  width: 100%;
  height: 100%;
  padding: ${({ theme }) => theme.space[1]};
`;
export const StyledFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
`;
interface StyledGridRowThird {
  onlyTwoLevels: boolean;
}
export const StyledGridRowThird = styled.div<StyledGridRowThird>`
  display: grid;
  grid-template-columns: 1fr ${({ onlyTwoLevels }) =>
      onlyTwoLevels ? "1fr" : "2fr"};
  width: 100%;
`;
export const StyledGridRowHalf = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100%;
  width: 100%;
`;
