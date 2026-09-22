import styled from "styled-components";

/** The height of a group heading, in px, shared with the list that sizes its rows. */
export const HEADING_HEIGHT = 24;

/**
 * The panel's horizontal gutter.
 *
 * One value for the search field, the chips, the group headings and the rows,
 * so everything down the panel starts on the same vertical line whatever the
 * researcher has dragged the panel's width to.
 */
const GUTTER = 4 as const;

export const StyledListPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
`;

export const StyledFilters = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[GUTTER]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledListBody = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;

  /* The scrollbar gets a column of its own rather than being drawn over the
     rows. A group heading is a full-width band with its count against the right
     edge, which is exactly where an overlay scrollbar sits. */
  [role="listbox"] {
    scrollbar-gutter: stable;
  }
`;

export const StyledRow = styled.div<{ $selected: boolean }>`
  /* focus has to be visible: the row is how a keyboard user moves through the
     corpus, and everything else on the page is gated on the selection */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.color["success"]};
    outline-offset: -2px;
  }

  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: 0 ${({ theme }) => theme.space[GUTTER]};
  height: 100%;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
  transition: background-color 0.15s ease-in-out;
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color["tableOpened"] : "transparent"};

  /* the bar the opened statement row draws, for the same idea: this row is the
     one the map and the suggestions panel are answering about */
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 9%;
    bottom: 9%;
    width: 5px;
    border-radius: 0 10px 10px 0;
    background-color: ${({ theme }) => theme.color["success"]};
    transform: scaleX(${({ $selected }) => ($selected ? 1 : 0)});
    transform-origin: left;
    opacity: ${({ $selected }) => ($selected ? 1 : 0)};
    transition:
      transform 0.15s ease-in-out,
      opacity 0.15s ease-in-out;
  }

  &:hover {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color["tableSelectionHover"] : theme.color["gray"][100]};
  }

  /* the actions belong to the row being worked on, not to every row at once */
  &:hover [data-row-actions],
  &:focus-within [data-row-actions] {
    opacity: 1;
  }

  &:hover [data-row-type],
  &:focus-within [data-row-type] {
    border-color: ${({ theme }) => theme.color["gray"][400]};
    background-color: ${({ theme }) => theme.color["white"]};
  }
`;

/**
 * The row's own content: what the Location is, and what is recorded on it.
 *
 * One line. The name and the coordinate are read together — a row scanned for
 * "which of these still needs doing" is answered by both at once — and stacking
 * them doubled the height of a list two and a half thousand rows long.
 */
export const StyledRowMain = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  flex: 1;
  min-width: 0;
`;

/** The tag gives way before the coordinate does: a name truncates, a figure cannot. */
export const StyledRowTag = styled.div`
  flex: 0 1 auto;
  min-width: 0;
`;

export const StyledRowLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["black"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledRowMeta = styled.div`
  flex: 0 0 auto;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-family: monospace;
  color: ${({ theme }) => theme.color["primary"]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * A Location whose coordinate props exist but cannot be read.
 *
 * `warning` is 2.16:1 on a light background — it was the least legible text on
 * the page, and it is the text that most needs reading.
 */
export const StyledRowProblem = styled(StyledRowMeta)`
  color: ${({ theme }) => theme.color["warningText"]};
`;

export const StyledEmpty = styled.div`
  padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[4]};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.color["greyer"]};
  line-height: 1.5;
`;

/**
 * The place type as its mark alone. A row is scanned rather than read, and the
 * word repeated down a column of forts carries less than the shape does; the
 * word stays available on hover for the cases the shape does not settle.
 */
/**
 * The kind of place, as its mark and as the control that changes it. `$unset`
 * is the state most of the corpus is in, drawn faintly so a row that states
 * nothing does not read as a row stating something.
 */
export const StyledRowType = styled.button<{ $unset?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  /* a 16px glyph is not a target; the square around it is what gets hit */
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 ${({ theme }) => theme.space[1]};
  /* the state mark beside it is not a control, and nothing but shape said so:
     the box appears where the row is being worked on, which is where the
     difference matters */
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background-color: transparent;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.base};
  color: ${({ theme, $unset }) =>
    $unset ? theme.color["gray"][400] : theme.color["greyer"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
    color: ${({ theme }) => theme.color["primary"]};
  }
`;

/**
 * Whether a row has a coordinate, said on the row itself.
 *
 * The heading says it too under `group by coordinates`, and says nothing about
 * it under every other arrangement — so the mark is what keeps a row readable
 * when the list is grouped by language, or not grouped at all.
 */
/**
 * Marking a row for a bulk action.
 *
 * The column is always there and the box is drawn only where it can be used —
 * under the pointer, focused, or once anything is marked. A checkbox on each of
 * two and a half thousand rows is a column of noise; a column that appears on
 * hover shifts every row sideways as the pointer crosses the list.
 */
export const StyledRowMarkBox = styled.span<{ $marked: boolean; $any: boolean }>`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme, $marked }) =>
    $marked ? theme.color["success"] : theme.color["gray"][500]};
  opacity: ${({ $marked, $any }) => ($marked || $any ? 1 : 0)};
  transition: opacity 0.15s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.color["success"]};
  }
`;

/**
 * The bar the marked set speaks through.
 *
 * Above the rows rather than over them: it names a count the researcher is
 * building, and a bar that floats over the list hides the rows being counted.
 */
export const StyledMarkedBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[GUTTER]};
  background-color: ${({ theme }) => theme.color["tableOpened"]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["primary"]};
`;

/** What the action can actually reach, where that is not the whole set. */
export const StyledMarkedReach = styled.span`
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledMarkedSpacer = styled.span`
  margin-left: auto;
`;

export const StyledRowMark = styled.span<{ $state: "geocoded" | "problem" | "none" }>`
  flex: 0 0 auto;
  margin-right: ${({ theme }) => theme.space[1]};
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 1px solid
    ${({ theme, $state }) =>
      $state === "geocoded"
        ? theme.color["success"]
        : $state === "problem"
          ? theme.color["danger"]
          : theme.color["gray"][400]};
  border-style: ${({ $state }) => ($state === "problem" ? "dashed" : "solid")};
  background-color: ${({ theme, $state }) =>
    $state === "geocoded" ? theme.color["success"] : "transparent"};
`;

/**
 * The kind of place where nothing can be done about it.
 *
 * A write owns the coordinate roles as well as the kind, so a Location with no
 * coordinate has nothing to write the kind against — the mark is a label there,
 * and drawing it as a button offered a picker whose choice went nowhere.
 */
export const StyledRowTypeStatic = styled.span<{ $unset?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.base};
  color: ${({ theme, $unset }) =>
    $unset ? theme.color["gray"][400] : theme.color["greyer"]};
`;

/**
 * The bar above the list, naming the group whose rows are on screen.
 *
 * Outside the scroller rather than sticky inside it: the list is virtualised and
 * `react-window` has no sticky headers, so the heading for the rows at the top
 * has usually not been rendered at all.
 */
/**
 * A group's heading.
 *
 * A row of the virtualised list, and — when it has scrolled out of the
 * viewport — the same heading parked against the edge it left by. There is only
 * ever one of each: a heading in flow is not also parked, so no group is ever
 * named twice on one screen.
 *
 * Parked rather than made sticky by CSS because the rows of a virtualised list
 * are positioned absolutely, so nothing in the scroller can stick to it.
 */
export const StyledGroupHead = styled.button`
  display: flex;
  width: 100%;
  border-left: none;
  border-right: none;
  cursor: pointer;
  /* centred rather than on a shared baseline: the label is uppercase beside a
     caret glyph and the count is monospace, three things whose baselines do not
     agree, so aligning on one of them leaves the other two sitting high */
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 ${({ theme }) => theme.space[GUTTER]};
  /* a step above the page's own canvas, which is gray 200: painted in that,
     a heading is a band only its own hairlines make visible */
  background-color: ${({ theme }) => theme.color["gray"][300]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledGroupLabel = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color["primary"]};
`;

/** Points down when the group is open. */
export const StyledGroupCaret = styled.span<{ $open: boolean }>`
  display: flex;
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.2s ease-in-out;
`;

export const StyledGroupCount = styled.span`
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * Where a heading goes when its group's rows are off screen.
 *
 * Above the viewport it parks at the top, below it parks at the bottom, so the
 * direction it sits in is the direction it is in — and every group stays one
 * click away however far the list has been scrolled.
 */
export const StyledParked = styled.div<{ $edge: "top" | "bottom"; $gutter: number }>`
  position: absolute;
  left: 0;
  /* clear of the scrollbar's column, so a parked heading is the same width as
     the one it replaces rather than reaching under it */
  right: ${({ $gutter }) => $gutter}px;
  z-index: 2;
  ${({ $edge }) => ($edge === "top" ? "top: 0;" : "bottom: 0;")}
  display: flex;
  flex-direction: column;
  /* the scroller owns the space to the right of the rows */
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

/** A parked heading, drawn as the heading it is, with an edge to sit against. */
export const StyledParkedHead = styled.div<{ $edge: "top" | "bottom" }>`
  height: ${HEADING_HEIGHT / 10}rem;
  box-shadow: ${({ $edge }) =>
    $edge === "top" ? "0 2px 3px rgba(0, 0, 0, 0.10)" : "0 -2px 3px rgba(0, 0, 0, 0.10)"};
`;

/**
 * How the list is arranged, beside the field that narrows it.
 *
 * Next to the search rather than among the filter chips: every chip below
 * removes Locations from the list and this one removes none, so sitting in that
 * row it would read as a seventh filter.
 */
export const StyledArrangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};

  > *:first-child {
    flex: 1;
    min-width: 0;
  }
`;

export const StyledArrangeIcon = styled.span`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
`;

/**
 * A chip's value.
 *
 * Bounded, because the value is a name somebody else chose: a territory called
 * "Process against Bernard Niort and his family" is one chip wider than the
 * panel. The whole of it is on the chip's tooltip and in the picker.
 */
export const StyledChipValue = styled.span`
  max-width: 11rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * The name of the filter and the field that narrows its options.
 *
 * Pinned, because the field it holds is useless once it has scrolled away from
 * the options it is filtering.
 */
export const StyledChipMenuTop = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: ${({ theme }) => theme.color["gray"][150]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][300]};
`;

/** Narrows a long option list. */
export const StyledChipSearch = styled.div`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]}
    ${({ theme }) => theme.space[3]};
`;

/** Said where a list of options would be, so the menu never looks broken. */
export const StyledChipNoMatch = styled.div`
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[3]};
  text-align: center;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** A picker that is not a list of options, inside the menu every chip opens. */
export const StyledChipContent = styled.div`
  min-width: 24rem;
`;

/**
 * One filter.
 *
 * Dashed and quiet while unset, so six of them read as an offer rather than as
 * six things to take in; solid and stating their value once set.
 */
export const StyledChip = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  /* six of these are the panel's whole filter surface, and a 15px-tall pill is
     a target the pointer misses more often than it lands */
  min-height: 2.2rem;
  padding: 0 ${({ theme }) => theme.space[2]};
  border-radius: 1.1rem;
  cursor: pointer;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  border: 1px ${({ $on }) => ($on ? "solid" : "dashed")}
    ${({ theme, $on }) => ($on ? theme.color["success"] : theme.color["gray"][400])};
  background-color: ${({ theme, $on }) =>
    $on ? theme.color["gray"][100] : theme.color["white"]};
  color: ${({ theme, $on }) => ($on ? theme.color["primary"] : theme.color["greyer"])};
  font-weight: ${({ theme, $on }) =>
    $on ? theme.fontWeight["medium"] : theme.fontWeight["normal"]};

  &:hover {
    border-color: ${({ theme }) => theme.color["success"]};
  }
`;

/** The field's name, which stays quiet beside the value it qualifies. */
export const StyledChipField = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledChipDrop = styled.span`
  display: inline-grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  margin-right: -${({ theme }) => theme.space[1]};
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.color["gray"][300]};
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledClearAll = styled.button`
  margin-left: auto;
  min-height: 2.2rem;
  padding: 0 ${({ theme }) => theme.space[1]};
  border: none;
  background: none;
  cursor: pointer;
  text-decoration: underline;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

/** Portalled to the body, so the panel's own overflow cannot clip it. */
export const StyledChipMenu = styled.div<{ $left: number; $top: number }>`
  position: fixed;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  z-index: 60;
  /* wide enough for the search field the long lists carry, so a menu does not
     change width with the filter it belongs to */
  min-width: 21rem;
  max-width: 32rem;
  max-height: 30rem;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

export const StyledChipMenuHead = styled.div`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledChipOption = styled.button<{ $on: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  min-height: 2.4rem;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme, $on }) =>
    $on ? theme.color["gray"][200] : theme.color["white"]};
  font-weight: ${({ theme, $on }) =>
    $on ? theme.fontWeight["medium"] : theme.fontWeight["normal"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;

export const StyledChipOptionCount = styled.span`
  flex: 0 0 auto;
  font-family: monospace;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledTerritoryFilter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]};
`;

export const StyledTerritoryRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};

  /* the field takes the rest of the row. A full-width input in a flex row with
     no basis collapses to nothing, which is a 0px input that still takes focus */
  > *:last-child {
    flex: 1;
    min-width: 0;
  }
`;

export const StyledTerritoryRowHead = styled.span`
  flex: 0 0 auto;
  width: 8rem;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The chosen territory's ancestors, so a name shared by two is still readable. */
export const StyledTerritoryPath = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: ${({ theme }) => theme.space[1]} 0;
`;

/**
 * A row's own actions.
 *
 * Hidden until the row is under the pointer or selected: a column of buttons
 * down a list of two and a half thousand rows is a column of noise, and the
 * row's name is what the list is read for.
 */
export const StyledRowActions = styled.div<{ $busy?: boolean }>`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  /* held open while the engine is being asked about this row: pressing the
     control disables it, which takes the focus the row was being kept open by,
     and a pointer that has moved on would leave the wait with nothing to show
     it */
  opacity: ${({ $busy }) => ($busy ? 1 : 0)};
  transition: opacity 0.15s ease-in-out;
`;

export const StyledRowAction = styled.button`
  display: grid;
  place-items: center;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  background: none;
  cursor: pointer;
  color: ${({ theme }) => theme.color["greyer"]};

  &:hover {
    border-color: ${({ theme }) => theme.color["gray"][400]};
    background-color: ${({ theme }) => theme.color["white"]};
    color: ${({ theme }) => theme.color["primary"]};
  }

  &:disabled {
    cursor: default;
  }
`;
