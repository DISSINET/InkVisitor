import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IValue {
  inverted?: boolean;
}
export const Wrapper = styled.div`
  margin-top: ${space2};
`;
export const Label = styled.span`
  text-align: right;
  margin-right: ${space2};
  vertical-align: top;
  font-weight: bold;
  line-height: 2.5rem;
`;
export const StyledInput = styled.input<IValue>`
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? "white" : theme.colors["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.colors["primary"] : "white"};
  border-width: ${({ theme }) => theme.borderWidths[2]};
  border-color: ${({ theme }) => theme.colors["primary"]};
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  padding: ${space1};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledSelect = styled.select<IValue>`
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? "white" : theme.colors["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.colors["primary"] : "white"};
  border-width: ${({ theme }) => theme.borderWidths[2]};
  border-color: ${({ theme }) => theme.colors["primary"]};
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  font-weight: bold;
  padding: ${space1};
  resize: none;
  :focus {
    outline: 0;
  }
`;
export const StyledTextArea = styled.textarea<IValue>`
  text-align: left;
  color: ${({ inverted, theme }) =>
    inverted ? "white" : theme.colors["primary"]};
  background-color: ${({ inverted, theme }) =>
    inverted ? theme.colors["primary"] : "white"};
  border-width: ${({ theme }) => theme.borderWidths[2]};
  border-color: ${({ theme }) => theme.colors["primary"]};
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  padding: ${space1};
  resize: none;
  line-height: 1.2;
  :focus {
    outline: 0;
  }
`;
