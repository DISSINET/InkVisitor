import styled from "styled-components";

export const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space["32"]} 1fr;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[2]};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledRowHeader = styled.div`
  color: ${({ theme }) => theme.color.black};
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  text-align: right;
`;

export const StyledRowControl = styled.div`
  position: relative;
  min-width: 0;
`;

export const StyledDateRange = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledDateRangeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[0]};
`;

export const StyledDateRangeLabel = styled.span`
  color: ${({ theme }) => theme.color.gray[600]};
  font-size: ${({ theme }) => theme.fontSize.xxxs};
  text-transform: lowercase;
`;
