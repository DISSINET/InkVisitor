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
  padding-left: 0.5rem;
  border: 1px solid ${({ theme }) => theme.color.gray[500]};
  font-weight: 600;
  font-size: 1.2rem;
  background-color: ${({ theme }) => theme.color.gray[100]};
  color: ${({ theme }) => theme.color.gray[700]};
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
  background-color: ${({ theme, $isLevel1 }) =>
    $isLevel1 ? theme.color.gray[400] : "transparent"};
  margin-left: ${({ marginLeft }) => marginLeft}rem;
  position: relative;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme, $isLevel1 }) =>
      $isLevel1 ? theme.color.gray[500] : theme.color.gray[100]};
  }
`;

export const TreeLineContainer = styled.div<{
  $isLevel1: boolean;
  $marginLeft: number;
}>`
  position: relative;
  margin-left: ${({ $marginLeft }) => $marginLeft}rem;

  &::before {
    content: "";
    position: absolute;
    left: -1.5rem;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: ${({ theme }) => theme.color.gray[400]};
    display: ${({ $isLevel1 }) => ($isLevel1 ? "none" : "block")};
  }

  &::after {
    content: "";
    position: absolute;
    left: -1.5rem;
    top: 50%;
    width: 1rem;
    height: 1px;
    background-color: ${({ theme }) => theme.color.gray[400]};
    display: ${({ $isLevel1 }) => ($isLevel1 ? "none" : "block")};
  }
`;

export const TreeLineVertical = styled.div<{ $height: number }>`
  position: absolute;
  left: -1.5rem;
  top: 0;
  width: 1px;
  height: ${({ $height }) => $height}px;
  background-color: ${({ theme }) => theme.color.gray[400]};
  z-index: 1;
`;

export const TreeLineHorizontal = styled.div<{ $left: number }>`
  position: absolute;
  left: ${({ $left }) => $left}rem;
  top: 50%;
  width: 1rem;
  height: 1px;
  background-color: ${({ theme }) => theme.color.gray[400]};
  z-index: 1;
`;
