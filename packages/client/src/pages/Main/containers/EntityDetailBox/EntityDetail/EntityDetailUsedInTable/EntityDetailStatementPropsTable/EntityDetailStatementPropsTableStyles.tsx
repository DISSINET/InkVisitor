import styled from "styled-components";

export const StyledTagWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledHeading = styled.div`
  display: flex;
  margin-right: auto;
`;
export const StyledUsedInTitle = styled.div`
  padding-left: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["info"]};
`;

export const StyledTableWrapper = styled.div`
  margin-top: 1rem;
  margin-bottom: 2.5rem;
`;
export const StyledTableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.space[4]};
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  background-color: ${({ theme }) => theme.color.gray[100]};
  color: ${({ theme }) => theme.color.black};
`;
interface StyledTableRowProps {
  $isLevel1: boolean;
  // in px
  marginLeft: number;
}
export const StyledTableRow = styled.div<StyledTableRowProps>`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr auto;
  gap: ${({ theme }) => theme.space[4]};
  padding: 0.5rem;
  border-radius: ${({ theme, $isLevel1 }) =>
    $isLevel1 ? theme.borderRadius.sm : "0"};
  border-bottom: ${({ theme, $isLevel1 }) =>
    $isLevel1
      ? `2px solid ${theme.color.gray[500]}`
      : `0px solid ${theme.color.gray[500]}`};
  background-color: ${({ theme, $isLevel1 }) =>
    $isLevel1 ? theme.color.gray[100] : "transparent"};
  margin-left: ${({ marginLeft }) => marginLeft}rem;
  margin-bottom: ${({ theme, $isLevel1 }) => ($isLevel1 ? "0.5rem" : "0")};
`;
