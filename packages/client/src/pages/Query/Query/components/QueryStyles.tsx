import styled from "styled-components";

export const StyledGraphNode = styled.div`
  border-radius: 20px;
  width: ${({ theme }) => theme.space[16]};
  height: ${({ theme }) => theme.space[16]};
  padding: 0;
  font-weight: bold;
  display: flex;
  align-items: center;

  > div {
    width: ${({ theme }) => theme.space[16]};
  }
  .StyledSelectWrapper {
  }
  .react-select__control {
    background-color: transparent;
    border: transparent;
    text-align: center;
  }
  .react-select__single-value {
    color: white;
    font-weight: 900 !important;
    font-size: large;
  }
`;
