import { CgClose } from "react-icons/cg";
import styled from "styled-components";

interface StyledTab {
  isSelected?: boolean;
}
export const StyledTab = styled.div<StyledTab>`
  display: inline-flex;
  justify-content: space-between;
  align-items: flex-end;
  cursor: pointer;
  background-color: ${({ theme, isSelected }) =>
    isSelected ? "transparent" : theme.color["gray"][100]};
  margin-right: 1px;
  padding-left: ${({ theme }) => theme.space[2]};
  position: relative;

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-bottom: ${({ isSelected }) => (isSelected ? "none" : "")};

  width: 100%;
  overflow: hidden;
`;
interface StyledLabel {
  isItalic?: boolean;
  isSelected?: boolean;
}
export const StyledLabel = styled.div<StyledLabel>`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme, isSelected }) =>
    isSelected ? "" : theme.color["gray"][700]};
  padding: ${({ theme }) => theme.space[1]};
  display: inline-block;
  overflow: hidden;
  vertical-align: middle;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: 100%;
  height: 100%;
  font-style: ${({ isItalic }) => (isItalic ? "italic" : "")};
`;

export const StyledClose = styled.span`
  display: flex;
  align-items: center;
  height: 100%;
  margin: 0 0.2rem;
`;

export const StyledCgClose = styled(CgClose)`
  border-radius: 5px;
  padding: 1px;
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;

export const StyledItalic = styled.i`
  height: 100%;
  display: flex;
  align-items: center;
`;
interface StyledTypeWrapper {
  isTemplate?: boolean;
}
export const StyledTypeWrapper = styled.div<StyledTypeWrapper>`
  margin-top: ${({ isTemplate }) => (isTemplate ? "3px" : 0)};
`;
