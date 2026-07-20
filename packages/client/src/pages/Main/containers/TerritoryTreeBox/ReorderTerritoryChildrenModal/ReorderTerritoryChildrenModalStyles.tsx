import styled from "styled-components";

export const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 30rem;
`;

interface StyledRowProps {
  $isDragging: boolean;
}
export const StyledRow = styled.div<StyledRowProps>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  opacity: ${({ $isDragging }) => ($isDragging ? 0.4 : 1)};
  cursor: grab;
`;

export const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.color["gray"][600]};
  flex-shrink: 0;
`;

export const StyledIndex = styled.span`
  color: ${({ theme }) => theme.color["gray"][600]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  min-width: 2rem;
  text-align: right;
  flex-shrink: 0;
`;
