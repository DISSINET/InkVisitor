import styled from "styled-components";

interface StyledTab {
  isSelected?: boolean;
}
export const StyledTab = styled.div<StyledTab>`
  display: inline-flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-grow: 1;
  cursor: pointer;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["blue"][200] : theme.color["blue"][100]};
  margin-right: 1px;
  padding-left: ${({ theme }) => theme.space[2]};

  border-top-left-radius: 3px;
  border-top-right-radius: 3px;

  max-width: 100%;
  overflow: hidden;
`;

export const StyledLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding: ${({ theme }) => theme.space[1]};
  display: inline-block;
  overflow: hidden;
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 100%;
`;
