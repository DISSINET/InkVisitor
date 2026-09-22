import styled from "styled-components";

export const StyledSettingsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  align-items: center;
`;

export const StyledSectionHeading = styled.div`
  grid-column: 1 / -1;
  margin-top: ${({ theme }) => theme.space[4]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledSectionNote = styled.div`
  grid-column: 1 / -1;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.5;
`;

/**
 * A control that is a table of its own, laid across both columns.
 *
 * The grid pairs a label with a control, which is the shape of every row here
 * but one: the gazetteer list has its own two columns and no label, and squeezed
 * into the control column its figures would not line up under anything.
 */
export const StyledFullRow = styled.div`
  grid-column: 1 / -1;
`;

/**
 * A section that saves itself, and whether it has anything to save.
 *
 * One section of the global modal is not a role assignment, and the footer's
 * Save writes the assignments. Its own button sits with it rather than in the
 * footer, so the two are never mistaken for each other.
 */
export const StyledSectionAction = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[2]};
`;

export const StyledSectionActionNote = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["warningText"]};
  line-height: 1.5;
`;

export const StyledRowLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
  white-space: nowrap;
`;

/**
 * Holds the mark that says what a preference does, beside its name.
 *
 * The names are two or three words so the column reads down; the sentence each
 * one needs is on the mark. The mark is the app's own tooltip icon, so these
 * read like every other explained control rather than like a browser's.
 */
export const StyledRowInfo = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize.xs};
`;

export const StyledRowControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  min-width: 0;
`;

/**
 * One slot per row, holding either the entity a role points at or the suggester
 * that fills it — never both, since a filled role is changed by unlinking it
 * first. The width is fixed so that what follows on a gazetteer row, its base
 * URL field, starts at the same place down the whole column.
 */
export const StyledPick = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex-shrink: 0;
  width: 21rem;
  min-width: 0;
`;

/** A stored id whose entity no longer resolves — nothing cleans settings up. */
export const StyledDangling = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["warningText"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledBaseUrl = styled.div`
  flex: 1;
  min-width: 12rem;
`;
