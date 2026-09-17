import styled from "styled-components";

// Query Builder box buttons: compact result-expansion checkboxes (#2969),
// grouped as a single ButtonGroup item next to "run search".
export const StyledResultExpansionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: 0 ${({ theme }) => theme.space[2]};
`;

interface StyledExpansionToggle {
  $active: boolean;
  $variant: "equivalent" | "subordinate";
}
// pill around one expansion checkbox: the accent tint is the state cue, since a
// bare box at this size reads the same checked and unchecked from a distance.
// The hues match the eq/sub badges on the result tags (see StyledExpansionBadge).
export const StyledExpansionToggle = styled.div<StyledExpansionToggle>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  /* no vertical padding: the pill must not make the header row taller than the
     buttons beside it */
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  line-height: 1;
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  border: 1px solid
    ${({ theme, $active, $variant }) =>
      $active
        ? theme.color[$variant === "equivalent" ? "info" : "warning"]
        : theme.color["gray"][400]};
  background-color: ${({ theme, $active, $variant }) =>
    $active
      ? theme.color["invertedBg"][$variant === "equivalent" ? "info" : "warning"]
      : "transparent"};
  cursor: pointer;

  label {
    font-weight: ${({ theme, $active }) =>
      $active ? theme.fontWeight["bold"] : theme.fontWeight["normal"]};
    color: ${({ theme, $active }) => ($active ? theme.color["black"] : theme.color["gray"][700])};
  }

  &:hover {
    border-color: ${({ theme, $variant }) =>
      theme.color[$variant === "equivalent" ? "info" : "warning"]};
  }
`;

interface StyledExpansionCount {
  $variant: "equivalent" | "subordinate";
}
// how many rows the expansion added to the current result - the toggle's effect
// lands in the Explorer, so the number is the only feedback available here
export const StyledExpansionCount = styled.span<StyledExpansionCount>`
  padding: 0 0.2rem;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: ${({ theme, $variant }) =>
    theme.color[$variant === "equivalent" ? "info" : "warning"]};
  color: ${({ theme, $variant }) =>
    $variant === "equivalent" ? theme.color["white"] : theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  line-height: 1.2;
`;
