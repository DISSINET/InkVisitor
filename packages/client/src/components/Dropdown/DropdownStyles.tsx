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
}
export const StyledSelectWrapper = styled.div<StyledSelectWrapper>`
  display: inline-flex;
  vertical-align: bottom;
  max-width: 100%;
  width: ${({ width }) => getWidth(width)};
`;
interface StyledSelect {
  width?: number | "full";
}
export const StyledSelect = styled(Select)`
  font-weight: bold;
  display: inline-flex;
  min-height: ${({ theme }) => theme.space[10]};
  vertical-align: bottom;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  height: ${({ theme }) => theme.space[10]};
  max-width: 100%;
  width: 100%;
  .react-select__control {
    width: ${({ width }) => getWidth(width)};
    max-width: 100%;
    height: ${({ theme }) => theme.space[10]};
    min-height: ${({ theme }) => theme.space[10]};
    border: 2px solid black;
    border-radius: 0;
    :hover {
      border-color: black;
    }
  }
  .react-select__control--is-focused {
    box-shadow: none;
  }
  .react-select__value-container {
    padding: 0 0.25rem;
    width: ${({ width }) => getWidth(width)};
  }
  .react-select__single-value {
    font-size: ${({ theme }) => theme.fontSize["sm"]};
    top: 50%;
    font-weight: normal;
    color: black;
    vertical-align: middle;
  }
  .react-select__indicator {
    color: black;
    padding: 0 0.25rem;
  }
  .react-select__indicator-separator {
    display: none;
  }
  .react-select__menu {
    border-radius: 0;
    box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
    width: ${({ width }) => (width === "full" ? "100%" : "auto")};
  }
  .react-select__option {
    :hover {
      background-color: rgba(212, 219, 244, 0.3);
    }
  }
  .react-select__option--is-selected {
    background-color: ${({ theme }) => theme.color["primary"]};
    color: white;
    :hover {
      background-color: ${({ theme }) => theme.color["primary"]};
    }
  }
`;
