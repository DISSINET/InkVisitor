import styled from "styled-components";

interface StyledToggle {
  $active: boolean;
}
export const StyledToggle = styled.div<StyledToggle>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme, $active }) => ($active ? theme.color["info"] : theme.color["danger"])};
  cursor: pointer;
`;

export const StyledToggleLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: 400;
`;
