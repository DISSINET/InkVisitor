import styled from "styled-components";

/**
 * The question the engine is being asked, kept on screen.
 *
 * At the top of the panel and outside everything that depends on a selection:
 * the context is what the next request will carry whether or not a Location is
 * chosen, and reading a wrong answer is exactly the moment it needs changing.
 */
export const StyledContextPanel = styled.div`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledContextHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
`;

/**
 * The whole heading, as the control that folds the panel away.
 *
 * The summary sits inside it rather than beside it: collapsed, the line is one
 * thing to read and one thing to press, and a strip of text that is only
 * sometimes a target is worse than either.
 */
export const StyledContextToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
`;

/** Points down when the panel is open. */
export const StyledContextCaret = styled.span<{ $open: boolean }>`
  display: flex;
  flex: 0 0 auto;
  color: ${({ theme }) => theme.color["greyer"]};
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.2s ease-in-out;
`;

/**
 * The whole question on one line, while the fields are folded away.
 *
 * Named by the same labels the fields carry, not by the ids underneath them —
 * a summary in a second vocabulary is one more thing to learn. A field the
 * researcher has moved off the project's answer is drawn firmly, so the folded
 * line still says which part of the question is theirs.
 */
export const StyledContextSummary = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledContextSummaryPart = styled.span<{ $set: boolean; $overridden: boolean }>`
  color: ${({ theme, $set }) => ($set ? theme.color["primary"] : theme.color["greyer"])};
  font-weight: ${({ theme, $overridden }) =>
    $overridden ? theme.fontWeight["medium"] : theme.fontWeight["normal"]};
`;

export const StyledContextSeparator = styled.span`
  padding: 0 ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["gray"][500]};
`;

export const StyledContextTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color["primary"]};
`;

/** Returns every field to what the project and the researcher's own options say. */
export const StyledContextReset = styled.button`
  flex: 0 0 auto;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledContextNote = styled.div`
  margin-top: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.5;
`;

/**
 * A row per dimension: what it is called, what it holds, and how much it counts.
 *
 * Three columns rather than two, because the weight is not a second setting
 * about the field — it is how much that field's answer weighs in the one number
 * the engine ranks sources by, and reading the two apart would mean reading the
 * question in two places.
 */
export const StyledContextGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[3]};
`;

/** The weight, as one control and the number it is sitting at. */
export const StyledWeightCell = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

/**
 * How much this dimension counts.
 *
 * Kept well short of the field beside it, which would claim the row is mostly
 * about the weight — but wide enough that its ten positions are ten separate
 * targets rather than a gesture to be nudged into place.
 */
export const StyledWeightSlider = styled.input<{ $moved: boolean }>`
  width: 7.5rem;
  height: ${({ theme }) => theme.space[3]};
  cursor: pointer;
  accent-color: ${({ theme, $moved }) =>
    $moved ? theme.color["primary"] : theme.color["gray"][500]};
`;

/**
 * The weight in words.
 *
 * Zero is written as "off" rather than as a number, because it is not a small
 * weight: the dimension leaves the score and stops vetoing sources, so region
 * or period set here lets every gazetteer run.
 */
export const StyledWeightValue = styled.span<{ $moved: boolean; $off: boolean }>`
  min-width: 2rem;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme, $moved, $off }) =>
    $off ? theme.color["danger"] : $moved ? theme.color["primary"] : theme.color["greyer"]};
  font-weight: ${({ theme, $moved }) =>
    $moved ? theme.fontWeight["medium"] : theme.fontWeight["normal"]};
`;

/**
 * A field's name.
 *
 * Drawn faintly where the field carries the default it was given and firmly
 * where the researcher has changed it, so which parts of the question are
 * theirs is readable without opening anything.
 */
export const StyledContextLabel = styled.label<{ $overridden: boolean }>`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  white-space: nowrap;
  color: ${({ theme, $overridden }) =>
    $overridden ? theme.color["primary"] : theme.color["greyer"]};
  font-weight: ${({ theme, $overridden }) =>
    $overridden ? theme.fontWeight["medium"] : theme.fontWeight["normal"]};
`;

/**
 * What this field would hold with no personal value on it.
 *
 * The whole of it rather than a mark: a mark says the field is overridden and
 * leaves the reader to open a modal to find out what it was overriding, which
 * is the trip the panel exists to remove. Pressing it drops the personal value.
 */
export const StyledContextGlobal = styled.button`
  grid-column: 2 / -1;
  justify-self: start;
  margin-top: -${({ theme }) => theme.space[1]};
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
    text-decoration: underline;
  }
`;

/**
 * The offer to ask again.
 *
 * Only while the suggestions below were found under a different question — an
 * answer to a question nobody is asking any more is the one state the panel
 * exists to make visible.
 */
export const StyledContextRerun = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-top: ${({ theme }) => theme.space[3]};
  padding-top: ${({ theme }) => theme.space[3]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledContextRerunNote = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["warningText"]};
  line-height: 1.5;
`;
