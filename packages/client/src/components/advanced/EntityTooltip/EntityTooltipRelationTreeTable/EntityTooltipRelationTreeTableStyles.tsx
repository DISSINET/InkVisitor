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
  margin-bottom: ${({ theme }) => theme.space[5]};
  border: 1px solid;
  border-color: ${({ theme }) => theme.color["white"]};
  width: ${({ depth }) => getBlockWidth(depth)};
`;
export const StyledTreeBlock = styled.div`
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.color["white"]};
  padding: ${({ theme }) => theme.space[1]};
  width: 100%;
  height: 100%;
`;
export const StyledFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  /* TODO: solve thirds */
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
