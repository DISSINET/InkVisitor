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
  disabled?: boolean;
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
    border: 1px solid ${({ theme }) => theme.color["gray"]["400"]};
    border-radius: 0;
    :hover {
      border-color: black;
    }
  }
  .react-select__control--is-disabled {
    background: repeating-linear-gradient(
      -45deg,
      #cbd5e0,
      #cbd5e0,
      1px,
      #fff 1px,
      #fff 12px
    );
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
