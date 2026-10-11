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


/** The source's name and the control that opens what is known about it. */
export const StyledGazetteerNameCell = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledGazetteerMore = styled.button<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  margin-top: ${({ theme }) => theme.space[1]};
  padding: 0 ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme, $open }) => ($open ? theme.color["primary"] : theme.color["greyer"])};
  background: transparent;
  border: none;
  cursor: pointer;

  svg {
    transform: ${({ $open }) => ($open ? "rotate(180deg)" : "none")};
  }

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
  }
`;

/** What is known about one source, laid across the whole table under its row. */
export const StyledGazetteerDetail = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  margin: 0 0 ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.color["gray"][100]};
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  line-height: 1.5;
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledDetailChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledDetailChip = styled.span<{ $tone: "good" | "caution" | "bad" | "neutral" }>`
  padding: 0 ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $tone }) =>
    $tone === "caution"
      ? theme.color["warningText"]
      : $tone === "bad"
        ? theme.color["danger"]
        : $tone === "good"
          ? theme.color["success"]
          : theme.color["greyer"]};
  background: ${({ theme }) => theme.color["white"]};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === "caution"
        ? theme.color["warning"]
        : $tone === "bad"
          ? theme.color["danger"]
          : $tone === "good"
            ? theme.color["success"]
            : theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
`;

/** A label beside what it labels, in a column that lines up down the card. */
export const StyledDetailRow = styled.div`
  display: grid;
  grid-template-columns: 7rem 1fr;
  gap: ${({ theme }) => theme.space[2]};
  align-items: start;
`;

export const StyledDetailLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** What the source cannot do, set apart because it is the part that changes a decision. */
export const StyledDetailLimits = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["warningText"]};
  background: ${({ theme }) => theme.color["white"]};
  border-left: 3px solid ${({ theme }) => theme.color["warning"]};
`;

export const StyledDetailLink = styled.a`
  color: ${({ theme }) => theme.color["primary"]};
  word-break: break-all;
`;

export const StyledDetailSmall = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;
