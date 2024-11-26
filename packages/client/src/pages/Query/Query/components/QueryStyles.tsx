import styled from "styled-components";

export const StyledGraphNode = styled.div`
  border-radius: 25px;
  height: ${({ theme }) => theme.space[18]};
  padding: ${({ theme }) => theme.space[4] + " " + theme.space[8]};
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: between;
  gap: ${({ theme }) => theme.space[4]};
  .react-select__control,
  input {
    background-color: ${({ theme }) => theme.color.white};
    border-color: ${({ theme }) => theme.color.grey};
    // border-radius: ${({ theme }) => theme.space[2]};
  }
`;

export const StyledNodeTypeSelect = styled.div`
  .react-select__control {
    background-color: transparent;
    border: none;
    text-align: center;
  }
  .react-select__single-value {
    color: ${({ theme }) => theme.color.primary};
    font-weight: 900 !important;
    font-size: large;
  }
`;
