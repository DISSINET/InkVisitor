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
  color: ${({ theme }) => theme.color.gray[800]};
  margin-right: ${({ theme }) => theme.space[2]};
  font-size: 1.1rem;
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
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

export const StyledDateRangeField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[0]};
`;

export const StyledDateRangeLabel = styled.span`
  color: ${({ theme }) => theme.color.gray[600]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  text-transform: lowercase;
`;

export const StyledCoOccurrenceBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledCoOccurrenceSummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledCoOccurrenceToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  color: ${({ theme }) => theme.color["info"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
`;

export const StyledCoOccurrenceChevron = styled.span<{ $expanded: boolean }>`
  display: inline-flex;
  transform: ${({ $expanded }) => ($expanded ? "rotate(180deg)" : "none")};
`;

export const StyledCoOccurrenceClear = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.color["info"]};
`;

export const StyledCoOccurrenceTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: ${({ theme }) => theme.space[1]};
  // a pasted batch can run to hundreds of entities - bound the row and scroll
  max-height: ${({ theme }) => theme.space[28]};
  overflow-y: auto;
`;

export const StyledCoOccurrenceUuidChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: 0 ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.color["gray"][300]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledCoOccurrenceChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledCoOccurrenceMore = styled.span`
  align-self: center;
  color: ${({ theme }) => theme.color.gray[600]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
`;
