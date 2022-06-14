import styled from "styled-components";

interface StyledTab {
  isSelected?: boolean;
}
export const StyledTab = styled.div<StyledTab>`
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  cursor: pointer;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][200] : theme.color["blue"][100]};
`;
