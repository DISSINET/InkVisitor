import Select from "react-select";
import styled from "styled-components";

interface StyledSelect {
  width?: number;
}
export const StyledSelect = styled(Select)`
  font-size: ${({ theme }) => theme.fontSizes["xs"]};
  font-weight: bold;
  width: ${({ width }) => (width ? `${width / 10}rem` : "100%")};
  .react-select__control {
    border: 2px solid black;
    border-radius: 0;
    min-height: 30px;
    max-height: 30px;
    :hover {
      border-color: black;
    }
  }
  .react-select__control--is-focused {
    box-shadow: none;
  }
  .react-select__value-container {
    padding: 0 0.25rem;
  }
  .react-select__single-value {
    color: black;
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
  }
  .react-select__option {
    :hover {
      background-color: rgba(212, 219, 244, 0.3);
    }
  }
  .react-select__option--is-selected {
    background-color: ${({ theme }) => theme.colors["primary"]};
    color: white;
    :hover {
      background-color: ${({ theme }) => theme.colors["primary"]};
    }
  }
`;
