import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IValueStyle {
  inverted?: boolean;
  width?: number;
  noBorder?: boolean;
}
export const Wrapper = styled.div`
  display: flex;
`;
export const Label = styled.span`
  text-align: right;
  margin-right: ${space2};
  vertical-align: top;
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  display: flex;
  align-items: flex-end;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledInput = styled.input<IValueStyle>`
  height: ${({ theme }) => theme.space[10]};
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, noBorder }) =>
    noBorder ? 0 : theme.borderWidth[2]};
  border-color: ${({ inverted, theme }) =>
    inverted ? theme.color["white"] : theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding: ${space1};
  width: ${({ width }) => (width ? `${width}px` : "100%")};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledSelect = styled.select<IValueStyle>`
  height: ${({ theme }) => theme.space[10]};
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, noBorder }) =>
    noBorder ? theme.borderWidth[2] : theme.borderWidth[2]};
  border-color: ${({ inverted, theme }) =>
    inverted ? theme.color["primary"] : theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: bold;
  width: ${({ width }) => (width ? width + "px" : "100%")};
  padding: ${space1};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledTextArea = styled.textarea<IValueStyle>`
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, noBorder }) =>
    noBorder ? 0 : theme.borderWidth[2]};
  border-color: ${({ theme }) => theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  width: ${({ width }) => (width ? `${width}px` : "100%")};
  padding: ${space1};
  resize: none;
  line-height: 1.2;
  :focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["success"]};
  }
`;
