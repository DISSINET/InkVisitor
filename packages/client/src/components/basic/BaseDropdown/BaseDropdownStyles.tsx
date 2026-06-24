import { FaChevronDown } from "react-icons/fa";
import Select from "react-select";
import styled from "styled-components";

const getWidth = (width?: number | "full") => {
  if (width) {
    return width === "full" ? "100%" : `${width / 10}rem`;
  } else {
    return "auto";
  }
};
interface StyledSelectWrapper {
  width?: number | "full";
  ref?: React.Dispatch<React.SetStateAction<HTMLButtonElement | null>>;
}
export const StyledSelectWrapper = styled.div<StyledSelectWrapper>`
  position: relative;
  display: inline-flex;
  vertical-align: bottom;
  max-width: 100%;
  width: ${({ width }) => getWidth(width)};
`;
export interface StyledSelect {
  width?: number | "full";
  disabled?: boolean;
  isOneOptionSingleEntitySelect?: boolean;
  suggester?: boolean;
  isMulti: boolean;
  entityDropdown?: boolean;
  userDropdown?: boolean;
  attributeDropdown?: boolean;
  wildCardChar?: boolean;
  icon?: React.ReactNode;
  loggerId?: string;
  limitSelectedItems?: number;
  shortLabel?: boolean;
}
export const StyledSelect = styled(Select)<StyledSelect>`
  display: inline-flex;
  vertical-align: bottom;
  font-size: ${({ theme }) => theme.fontSize["xs"]};

  max-width: 100%;
  width: 100%;

  .react-select__control {
    width: ${({ width }) => getWidth(width)};
    max-width: 100%;
    min-height: ${({ theme, userDropdown }) => (userDropdown ? theme.space[6] : theme.space[10])};
    // only for one row multi entity dropdown to avoid glitches during resizing
    // user dropdown is allowed to wrap and grow vertically
    height: ${({ limitSelectedItems, userDropdown }) =>
      limitSelectedItems && !userDropdown ? "27px" : ""};
    border-width: 1px;
    border-style: solid;
    border-color: ${({ theme, suggester }) =>
      suggester ? theme.color["black"] : theme.color["gray"]["400"]};
    border-right: ${({ suggester }) => (suggester ? "none" : "")};
    border-radius: 0;
    background-color: ${({ theme, entityDropdown, suggester }) =>
      entityDropdown && suggester ? theme.color["gray"][200] : theme.color["white"]};
    &:hover {
      border-color: ${({ theme }) => theme.color["info"]};
      border-width: 1px;
    }
  }
  .react-select__control--is-disabled {
    background: ${({ theme, isOneOptionSingleEntitySelect }) =>
      isOneOptionSingleEntitySelect ? "" : theme.background["stripes"]};
  }
  .react-select__control--is-focused {
    box-shadow: none;

    outline: 0;
    border-color: ${({ theme }) => theme.color["info"]};
    border-width: 1px;
  }
  .react-select__value-container {
    height: ${({ userDropdown }) => (userDropdown ? "auto" : "100%")};
    align-content: ${({ userDropdown }) => (userDropdown ? "flex-start" : "")};
    row-gap: ${({ userDropdown }) => (userDropdown ? "3px" : "")};
    padding: ${({ userDropdown }) => (userDropdown ? "2px 0.3rem" : "0")};
    margin: 0;
    width: ${({ width }) => getWidth(width)};
  }
  .react-select__single-value {
    font-size: ${({ theme }) => theme.fontSize["xs"]};
    top: 50%;
    margin-left: ${({ theme, entityDropdown, wildCardChar }) =>
      entityDropdown && !wildCardChar ? theme.space[3] : theme.space[2]};
    margin-top: 1px;

    color: ${({ theme }) => theme.color["primary"]};
    vertical-align: middle;
  }
  .react-select__placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
  }
  .react-select__multi-value {
    background-color: ${({ theme, entityDropdown }) =>
      entityDropdown ? theme.color["white"] : theme.color["invertedBg"]["primary"]};
    color: ${({ theme }) => theme.color["gray"][700]};
    border: 1px solid ${({ theme }) => theme.color["blue"][300]};
    min-width: ${({ userDropdown }) => (userDropdown ? "0" : "")};
    max-width: ${({ userDropdown }) => (userDropdown ? "100%" : "")};
    margin: ${({ userDropdown }) => (userDropdown ? "0" : "")};
  }
  .react-select__indicator {
    color: ${({ theme }) => theme.color["primary"]};
    padding: ${({ userDropdown }) => (userDropdown ? "0" : "")};
    svg {
      height: 18;
      ${({ userDropdown }) => (userDropdown ? "width: 14px; height: 14px;" : "")}
    }
  }
  .react-select__clear-indicator {
    padding: ${({ userDropdown }) => (userDropdown ? "0" : "0.2rem")};
    color: ${({ theme }) => theme.color["primary"]};
    svg {
      ${({ userDropdown }) => (userDropdown ? "width: 14px; height: 14px;" : "")}
    }
  }
  .react-select__indicator-separator {
    display: none;
  }
  .react-select__multi-value__label {
    color: ${({ theme }) => theme.color["black"]};
    padding: ${({ entityDropdown, userDropdown }) =>
      entityDropdown || userDropdown ? "0" : "0.2rem"};
    font-weight: ${({ entityDropdown }) => (entityDropdown ? "bold" : "")};
    border-radius: 1px;
    min-width: ${({ userDropdown }) => (userDropdown ? "0" : "")};
    max-width: ${({ userDropdown }) => (userDropdown ? "100%" : "")};
  }
  .react-select__multi-value__remove {
    padding-left: ${({ entityDropdown }) => (entityDropdown ? "0.2rem" : "")};
    padding-right: ${({ entityDropdown }) => (entityDropdown ? "0.2rem" : "")};
  }
  .react-select__input-container {
    color: ${({ theme }) => theme.color["black"]};
  }
  // portal menu style is in global stylesheet
`;

export const StyledFaChevronDown = styled(FaChevronDown)`
  margin-right: 4px;
  margin-left: 1px;
`;

export const StyledValueIconWrap = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin-left: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["greyer"]};
  align-items: center;
  display: flex;
`;
