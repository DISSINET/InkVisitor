import styled from "styled-components";

/** One row per source: a switch and any further columns, aligned down the list. */
export const StyledGazetteerTable = styled.div<{ $extra?: string[] }>`
  display: grid;
  grid-template-columns: ${({ $extra = [] }) => ($extra.length ? "auto" : "1fr")} ${({
    $extra = [],
  }) => $extra.join(" ")};
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
`;

/**
 * One source: a switch and any further cells, as a row of the grid.
 *
 * Has no box of its own, so it carries no styling; what is drawn faintly while a
 * source is switched off is its name, which is what the switch is about. Cells to their right stay at full strength because they are edited
 * independently of whether the source is asked.
 */
export const StyledGazetteerRow = styled.div`
  display: contents;
`;

/** A further column's content for one source, kept inside its grid cell. */
export const StyledGazetteerCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 0;
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
  opacity: ${({ $off }) => ($off ? 0.55 : 1)};
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

