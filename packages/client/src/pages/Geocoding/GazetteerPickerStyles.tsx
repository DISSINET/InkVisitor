import styled from "styled-components";

/**
 * Sixteen rows of a switch and a measurement.
 *
 * A grid rather than a list, because the figures are the reason the panel
 * exists and they only say anything read down as a column: 621k in 340 cells
 * beside 2k in 1,292 is the whole difference between a source about a place and
 * a source about everywhere.
 */
export const StyledGazetteerTable = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[4]};
  width: 100%;
`;

export const StyledGazetteerHead = styled.div`
  display: contents;

  span {
    padding-bottom: ${({ theme }) => theme.space[1]};
    border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
    font-size: ${({ theme }) => theme.fontSize.xxs};
    font-weight: ${({ theme }) => theme.fontWeight["medium"]};
    color: ${({ theme }) => theme.color["greyer"]};
  }

  span:last-child {
    text-align: right;
  }
`;

/** One source. Drawn faintly while it is switched off, which is most of what a reader scans for. */
export const StyledGazetteerRow = styled.div<{ $off: boolean }>`
  display: contents;
  opacity: ${({ $off }) => ($off ? 0.55 : 1)};
`;

export const StyledGazetteerSwitch = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} 0;
  cursor: pointer;

  input {
    margin-top: 0.2rem;
    cursor: pointer;
    accent-color: ${({ theme }) => theme.color["primary"]};
  }

  input:disabled {
    cursor: not-allowed;
  }
`;

export const StyledGazetteerName = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

/**
 * The source's own name, struck through while it is switched off.
 *
 * The rule lives here rather than on the row, because `text-decoration` is
 * inherited by every descendant and cannot be taken back by one: struck on the
 * whole cell, the sentence explaining what the source is would be struck too,
 * and a line through an explanation reads as the explanation being withdrawn.
 */
export const StyledGazetteerLabel = styled.span<{ $off: boolean }>`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $off }) => ($off ? theme.color["greyer"] : theme.color["black"])};
  text-decoration: ${({ $off }) => ($off ? "line-through" : "none")};
`;

/** A sentence under a name: what this source is, or why it cannot be switched on. */
export const StyledGazetteerNote = styled.span`
  font-family: ${({ theme }) => theme.fontFamily["body"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.4;
`;

export const StyledGazetteerLocked = styled(StyledGazetteerNote)`
  color: ${({ theme }) => theme.color["warningText"]};
`;

/** The engine says this source cannot answer. Not the same as switched off. */
export const StyledGazetteerUnwell = styled(StyledGazetteerNote)`
  color: ${({ theme }) => theme.color["danger"]};
`;

/**
 * What the engine counted, as one figure per row.
 *
 * `declared` where there is nothing to count: the source is a remote API, so
 * the engine falls back to how specific its own claim is, which always scores
 * below a measurement. The whole sentence is on the tooltip.
 */
export const StyledGazetteerFigure = styled.span`
  justify-self: end;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  white-space: nowrap;
  color: ${({ theme }) => theme.color["greyer"]};
  cursor: help;
`;
