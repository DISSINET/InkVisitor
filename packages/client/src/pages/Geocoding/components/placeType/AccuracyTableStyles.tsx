import styled from "styled-components";

/**
 * The project's accuracies, one row each, laid out as a table that scrolls
 * sideways where the modal is narrower than it.
 */
const COLUMNS = "26rem 6.5rem 6.5rem minmax(14rem, 1fr) 2.2rem 2.2rem 2.2rem";

export const StyledAccuracyScroll = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  overflow-x: auto;
`;

export const StyledAccuracyHeader = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: ${({ theme }) => theme.space[2]};
  min-width: 60rem;
  padding-bottom: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledAccuracyRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: ${({ theme }) => theme.space[2]};
  align-items: center;
  min-width: 60rem;
  padding: ${({ theme }) => theme.space[1]} 0;
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledAccuracyCell = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
`;

/** A mark's tick, centred under its column title. */
export const StyledAccuracyMark = styled.div`
  display: flex;
  justify-content: center;
`;

export const StyledAccuracyActions = styled.div`
  grid-column: 1 / -1;
  margin-top: ${({ theme }) => theme.space[2]};
`;
