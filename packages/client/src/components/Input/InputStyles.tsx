import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IValueStyle {
  inverted?: boolean;
  suggester?: boolean;
  width?: number | "full";
  noBorder?: boolean;
}
const getWidth = (width?: number | "full") => {
  if (width) {
    return width === "full" ? "100%" : `${width / 10}rem`;
  } else {
    return "auto";
  }
};
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
  border-style: solid;
  color: ${({ inverted, theme }) =>
    inverted ? theme.color["white"] : theme.color["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["primary"] : theme.color["white"]};
  border-width: ${({ theme, inverted }) =>
    inverted ? 0 : theme.borderWidth[1]};
  border-color: ${({ suggester, theme }) =>
    suggester ? theme.color["primary"] : theme.color["gray"]["400"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding: ${space1};
  width: ${({ width }) => getWidth(width)};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledSelect = styled.select<IValueStyle>`
  height: ${({ theme }) => theme.space[10]};
  text-align: left;
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["gray"][200] : theme.color["white"]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-color: ${({ suggester, theme }) =>
    suggester ? theme.color["primary"] : theme.color["gray"][400]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: bold;
  width: ${({ width }) => getWidth(width)};
  padding: ${space1};
  resize: none;
  :focus {
    outline: 0;
  }
`;

export const StyledSelectReadonly = styled.input<IValueStyle>`
  width: ${({ width }) => getWidth(width)};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.color["gray"][200] : theme.color["white"]};
  border-color: ${({ suggester, theme }) =>
    suggester ? theme.color["primary"] : theme.color["gray"][400]};
  border-width: ${({ theme }) => theme.borderWidth[1]};
  font-weight: bold;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  padding-left: ${({ theme }) => theme.space[3]};
  cursor: default;
  border-right: none;

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
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-color: ${({ theme }) => theme.color["gray"]["400"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  width: ${({ width }) => getWidth(width)};
  padding: ${space1};
  resize: none;
  line-height: 1.2;
  :focus {
    outline: 0;
    border-color: ${({ theme }) => theme.color["success"]};
    border-width: ${({ theme, noBorder }) =>
      noBorder ? 0 : theme.borderWidth[1]};
  }
`;
