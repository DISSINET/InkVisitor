import styled from "styled-components";

export const StyledNodeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  height: 100%;
`;

export const StyledGraphNode = styled.div`
  border-radius: 25px;
  height: ${({ theme }) => theme.space[18]};
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[7]}`};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};

  .react-select__input-container {
    color: ${({ theme }) => theme.color.white};
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
