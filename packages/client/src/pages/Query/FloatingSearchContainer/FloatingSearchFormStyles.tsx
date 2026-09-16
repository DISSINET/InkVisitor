import styled from "styled-components";

// height of the caption a stacked field carries above its input ("after",
// "before"). The row header offsets itself by the same amount so it lines up
// with the input rather than with the caption.
const FIELD_LABEL_HEIGHT = "1.2rem";

export const StyledForm = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledRow = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.space["32"]} 1fr;
  // a control can stack several fields under the first one (a date range, the
  // picked co-occurrence entities); the header belongs next to the first
  align-items: start;
  margin-bottom: ${({ theme }) => theme.space[2]};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const StyledRowHeader = styled.div<{ $belowFieldLabel?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  // one input tall, so the header sits centred against the control's first
  // input. Box-sizing is border-box, so the caption offset has to be added to
  // the height as well - it is padding, and would otherwise eat into it.
  min-height: ${({ theme, $belowFieldLabel }) =>
    $belowFieldLabel ? `calc(${theme.space[10]} + ${FIELD_LABEL_HEIGHT})` : theme.space[10]};
  padding-top: ${({ $belowFieldLabel }) => ($belowFieldLabel ? FIELD_LABEL_HEIGHT : "0")};
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
  height: ${FIELD_LABEL_HEIGHT};
  line-height: ${FIELD_LABEL_HEIGHT};
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

export const StyledCoOccurrenceListWrap = styled.div<{ $height: number }>`
  height: ${({ $height }) => `${$height}px`};
`;

export const StyledCoOccurrenceListRow = styled.div`
  display: flex;
  align-items: center;
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
