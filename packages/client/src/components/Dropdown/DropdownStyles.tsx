import { FaChevronDown } from "react-icons/fa";
import Select from "react-select";
import { ValueContainer } from "react-select/src/components/containers";
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
}
export const StyledSelectWrapper = styled.div<StyledSelectWrapper>`
  display: inline-flex;
  vertical-align: bottom;
  max-width: 100%;
  width: ${({ width }) => getWidth(width)};
`;
interface StyledSelect {
  width?: number | "full";
  disabled?: boolean;
  isOneOptionSingleSelect?: boolean;
  suggester?: boolean;
  entityDropdown?: boolean;
}
export const StyledSelect = styled(Select)`
  font-weight: bold;
  display: inline-flex;
  min-height: ${({ theme }) => theme.space[10]};
  vertical-align: bottom;
  font-size: ${({ theme }) => theme.fontSize["xs"]};

  max-width: 100%;
  width: 100%;
  .react-select__control {
    width: ${({ width }) => getWidth(width)};
    max-width: 100%;
    min-height: ${({ theme }) => theme.space[10]};
    border-width: 1px;
    border-style: solid;
    border-color: ${({ theme, suggester }) =>
      suggester ? theme.color["black"] : theme.color["gray"]["400"]};
    border-right: ${({ suggester }) => (suggester ? "none" : "")};
    border-radius: 0;
    background-color: ${({ theme, entityDropdown }) =>
      entityDropdown ? theme.color["gray"][200] : ""};
    :hover {
      border-color: black;
    }
  }
  .react-select__control--is-disabled {
    background: ${({ isOneOptionSingleSelect }) =>
      isOneOptionSingleSelect
        ? ""
        : `repeating-linear-gradient(
      -45deg,
      #cbd5e0,
      #cbd5e0,
      1px,
      #fff 1px,
      #fff 12px
    )`};
  }
  .react-select__control--is-focused {
    box-shadow: none;
  }
  .react-select__value-container {
    height: 100%;
    padding: 0;
    margin: 0;
    width: ${({ width }) => getWidth(width)};
  }
  .react-select__single-value {
    font-size: ${({ theme, entityDropdown }) =>
      entityDropdown ? theme.fontSize["xs"] : theme.fontSize["sm"]};
    font-weight: ${({ theme, entityDropdown }) =>
      entityDropdown ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
    top: 50%;
    margin-left: ${({ theme, entityDropdown }) =>
      entityDropdown ? theme.space[3] : theme.space[2]};
    margin-top: ${({ entityDropdown }) => (entityDropdown ? "1px" : 0)};

    color: black;
    vertical-align: middle;
  }
  .react-select__indicator {
    color: black;
    svg {
      height: 18;
    }
  }
  .react-select__indicator-separator {
    display: none;
  }
  .react-select__menu {
    border-radius: 0;
    box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
    width: 100%;
    transform: translate(0, -6px);
  }
  .react-select__option {
    margin: 0;
    padding: ${({ entityDropdown }) => (entityDropdown ? "2px" : "")};
    padding-left: ${({ entityDropdown }) => (entityDropdown ? 0 : "")};
    height: ${({ entityDropdown }) => (entityDropdown ? "2.5rem" : "")};

    :hover {
    }
  }
  .react-select__option--is-selected {
    background-color: ${({ theme }) => theme.color["primary"]};
    color: white;
    :hover {
      background-color: ${({ theme }) => theme.color["blue"][200]};
    }
  }
  .react-select__option--is-focused {
    background-color: ${({ theme }) => theme.color["blue"][200]};
  }
`;
interface StyledEntityValue {
  color?: string;
}
export const StyledEntityValue = styled.div<StyledEntityValue>`
  border-left-style: solid;
  border-left-width: 4px;
  border-left-color: ${({ theme, color }) => (color ? theme.color[color] : "")};
  height: 100%;
  padding: 5px;
`;
export const StyledFaChevronDown = styled(FaChevronDown)`
  margin-right: 4px;
  margin-left: 1px;
`;
