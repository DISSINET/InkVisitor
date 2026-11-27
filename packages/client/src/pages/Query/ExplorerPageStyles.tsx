import { BOX_HEADER_HEIGHT } from "Theme/constants";
import styled from "styled-components";
import { IcoCloseAll, IcoCloseVsc, IcoSquareHalf } from "Theme/icons";
import { thinScrollbar } from "Theme/thinScrollbar";

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

export const StyledCloseEditorIcon = styled(IcoCloseVsc)`
  transform: scale(1.3);
`;

export const StyledCloseAllIcon = styled(IcoCloseAll)`
  transform: scale(1.3);
`;

export const StyledRestoreBoxIcon = styled(IcoSquareHalf)`
  transform: rotate(270deg);
`;

// the query tree and the search rows floating over its bottom
export const StyledQueryBuilderArea = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

// The query tree scrolls on its own behind the search rows, which stay in place
// at the bottom of the Query Builder box.
export const StyledQueryScroller = styled.div<{ $searchRowsHeight: number }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* the Query Builder header floats over the top of the tree */
  padding-top: ${BOX_HEADER_HEIGHT / 10}rem;
  /* the resize handle straddles the box edge and covers this gap, so the horizontal
     scrollbar sits clear of it */
  margin-bottom: ${({ theme }) => theme.space[2]};
  /* room below the last node for its EQ / SUB badges, which hang over its bottom border,
     and for the search rows, so the last node scrolls clear of them */
  padding-bottom: calc(
    ${({ theme }) => theme.space[3]} + ${({ $searchRowsHeight }) => $searchRowsHeight}px +
      ${({ theme }) => theme.space[4]}
  );
  /* a node scrolled into view stops below the header and above the search rows, not
     behind them */
  scroll-padding-top: ${BOX_HEADER_HEIGHT / 10}rem;
  scroll-padding-bottom: calc(
    ${({ $searchRowsHeight }) => $searchRowsHeight}px + ${({ theme }) => theme.space[2]}
  );
  ${thinScrollbar}
`;

// a card floating over the bottom of the Query Builder box, the query tree visible around
// it, so the result rows read as part of the builder, not the top of the Explorer.
// It is as wide as its rows and centred, so on a wide screen the search button stays next
// to the filters
export const StyledSearchRows = styled.div<{ $scrollbarWidth: number; $scrollbarHeight: number }>`
  position: absolute;
  left: 0;
  /* centred on the query tree, beside its vertical scrollbar */
  right: ${({ $scrollbarWidth }) => $scrollbarWidth}px;
  /* on the query tree's horizontal scrollbar, or in its place, above the resize handle's gap */
  bottom: calc(
    ${({ theme }) => theme.space[2]} + ${({ $scrollbarHeight }) => $scrollbarHeight}px
  );
  /* above the grid cells of the query tree */
  z-index: 2;
  display: flex;
  width: fit-content;
  /* 100% is the whole box, the vertical scrollbar included */
  max-width: calc(
    100% - ${({ $scrollbarWidth }) => $scrollbarWidth}px - 2 * ${({ theme }) => theme.space[3]}
  );
  border: 1px solid ${({ theme }) => theme.color["gray"][300]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  margin: 0 auto;
  /* the query tree shows faintly through the card, blurred so its labels do not read
     behind the card's own */
  background-color: color-mix(in srgb, ${({ theme }) => theme.color["gray"][100]} 75%, transparent);
  backdrop-filter: blur(4px);
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  transition: background-color 0.2s ease;
  /* solid while the card is in use */
  &:hover,
  &:focus-within {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledSearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  /* the divider starts at the row content, clear of the card's rounded border, and
     ends as far from the search button: it reaches into the button cell's padding */
  position: relative;
  & + &::before {
    content: "";
    position: absolute;
    top: 0;
    left: ${({ theme }) => theme.space[3]};
    right: calc(${({ theme }) => theme.space[3]} - ${({ theme }) => theme.space[4]});
    border-top: 1px dashed ${({ theme }) => theme.color["gray"][300]};
  }
`;

export const StyledSearchRowCaption = styled.span`
  flex-shrink: 0;
  width: 11rem;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.color["gray"][600]};
`;

// the bottom padding sits on the rows only, so the search button centres on the whole card
export const StyledSearchRowStack = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding-bottom: ${({ theme }) => theme.space[1]};
`;

// the run button stacks its icon over its label, as the annotator warning actions do
// the button fills the card's height with the same gap to every card edge
export const StyledSearchRunCell = styled.div`
  display: flex;
  flex-shrink: 0;
  padding: ${({ theme }) => theme.space[4]};
  && button {
    flex-direction: column;
    justify-content: center;
    gap: 0.1rem;
    min-width: 6.4rem;
  }
  && button span {
    margin-left: 0;
  }
`;
