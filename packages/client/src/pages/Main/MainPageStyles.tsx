import styled from "styled-components";

export const StyledListAnnotatorTabGroup = styled.div`
  display: flex;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  margin-bottom: -1px;
`;

export const StyledListAnnotatorTab = styled.button<{ $isSelected: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? "transparent" : theme.color["gray"][100]};
  color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.color["black"] : theme.color["gray"][700]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-bottom: ${({ theme, $isSelected }) =>
    $isSelected ? "none" : `1px solid ${theme.color["gray"][500]}`};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  margin-right: 1px;
  &:hover {
    color: ${({ theme }) => theme.color["black"]};
  }
`;
