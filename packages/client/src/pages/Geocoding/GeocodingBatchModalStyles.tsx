import styled from "styled-components";
import { BatchStepState } from "./geocodingBatch";

export const StyledBatchList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 50vh;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

/**
 * One Location in the run.
 *
 * The step in flight is the only one drawn on a ground of its own. A list where
 * every state had a colour would be read as five categories; there are two that
 * matter — what was written and what was not — and one moment.
 */
/** One Location and everything shown under it. */
export const StyledBatchEntry = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][200]};

  &:last-child {
    border-bottom: none;
  }
`;

export const StyledBatchRow = styled.div<{ $running?: boolean }>`
  display: grid;
  grid-template-columns: 1.6rem minmax(8rem, 14rem) 1fr auto;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  background-color: ${({ theme, $running }) =>
    $running ? theme.color["gray"][200] : "transparent"};
`;

/** Opens the answers for a Location the run would not decide. */
export const StyledBatchToggle = styled.button`
  flex-shrink: 0;
  border: none;
  background-color: transparent;
  padding: 0;
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["success"]};
  text-decoration: underline;
`;

export const StyledBatchChoices = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]}
    ${({ theme }) => theme.space[2]} 2.4rem;
`;

/** The state, as one character. Colour carries the verdict; the glyph names it. */
export const StyledBatchMark = styled.span<{ $state: BatchStepState }>`
  font-family: monospace;
  text-align: center;
  color: ${({ theme, $state }) =>
    $state === "written"
      ? theme.color["success"]
      : $state === "failed"
        ? theme.color["danger"]
        : $state === "skipped"
          ? theme.color["warning"]
          : theme.color["gray"][500]};
`;

/**
 * The Location's name, and the way to it.
 *
 * A control that reads as text: the name is what the row is, and drawing it as
 * a button would put a second thing to press beside the one that matters. The
 * underline appears on hover, where a pointer has already asked the question.
 */
export const StyledBatchLabel = styled.span<{ $waiting?: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  padding: 0;
  border: none;
  background-color: transparent;
  font-size: inherit;
  font-family: inherit;
  cursor: pointer;
  color: ${({ theme, $waiting }) =>
    $waiting ? theme.color["gray"][500] : theme.color["black"]};

  &:hover {
    text-decoration: underline;
  }
`;

export const StyledBatchNote = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The count line above the list, which is what a glance reads. */
export const StyledBatchSummary = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["black"]};
`;
