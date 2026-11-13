import styled from "styled-components";

// fills the full-height modal, so the JSON field gets all the room left
export const StyledStep = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
  min-height: 0;
`;

export const StyledHint = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

// The field takes all the height the modal leaves (keeping a usable minimum
// when a long error list sits below it) and scrolls from there. The editor
// lays a highlighted <pre> under a transparent textarea; both take their font
// from this wrapper, so they stay aligned.
export const StyledJsonEditor = styled.div`
  flex: 1;
  width: 100%;
  min-height: ${({ theme }) => theme.space[48]};
  overflow: auto;
  font-family: monospace;
  /* between the theme's xxs and xs: long id lines fit unwrapped and stay
     easy to read, as the input placeholders' 1.1rem */
  font-size: 1.1rem;
  line-height: 1.4;
  color: ${({ theme }) => theme.color["primary"]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"]["400"]};
  border-radius: ${({ theme }) => theme.borderRadius.input};

  &:hover {
    border-color: ${({ theme }) => theme.color["info"]};
  }
  &:focus-within {
    border-color: ${({ theme }) => theme.color["info"]};
    box-shadow: inset 0 0 0 0.1rem ${({ theme }) => theme.color["info"]};
  }

  /* the editor's own box; its textarea covers it whole, so a click anywhere
     in the empty field lands in the textarea */
  & > div {
    min-height: 100%;
  }
  textarea {
    outline: 0;
  }
  textarea::placeholder {
    color: ${({ theme }) => theme.color["gray"][500]};
  }

  /* the Annotator XML view palette: keys and values sit in hue families far
     apart, so they are told apart at a glance */
  .token.property {
    color: ${({ theme }) => theme.color["xmlAttr"]};
  }
  .token.string {
    color: ${({ theme }) => theme.color["xmlValue"]};
  }
  .token.number,
  .token.boolean,
  .token.null {
    color: ${({ theme }) => theme.color["xmlTag"]};
  }
  .token.punctuation,
  .token.operator {
    color: ${({ theme }) => theme.color["xmlQuote"]};
  }
`;

// the draft tabs take the modal's height; Detail scrolls inside its own box
// the tabs sit right on the Detail below them, as in the Detail box
export const StyledDrafts = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0;
`;

// a long list of errors or notes scrolls on its own, so Detail keeps its room
export const StyledDraftIssues = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[2]};
  max-height: ${({ theme }) => theme.space[40]};
  margin-bottom: ${({ theme }) => theme.space[2]};
  overflow: auto;
`;

export const StyledDraftDetail = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: ${({ theme }) => theme.space[64]};
  overflow: hidden;
  background-color: ${({ theme }) => theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][500]};
  /* the list on the left draws this edge, open where the selected row is */
  border-left: none;
  border-radius: ${({ theme }) => `0 ${theme.borderRadius.sm} ${theme.borderRadius.sm} 0`};
`;

// Left of the Detail: the tools to find a draft over every draft, grouped by
// class, as tabs turned on their side. Each piece draws its part of the edge
// shared with the Detail, so the selected row can leave its part out and open
// into the Detail.
export const StyledDraftListBox = styled.div<{ $width: number }>`
  /* holds the resize handle on its right edge */
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: ${({ $width }) => $width}px;
  min-height: 0;
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"][500]};
  border-right: none;
  border-radius: ${({ theme }) => `${theme.borderRadius.sm} 0 0 ${theme.borderRadius.sm}`};
  background-color: ${({ theme }) => theme.color["gray"][100]};
`;

// dragged sideways, sets the width of the list; it straddles the edge the
// list shares with the Detail
export const StyledDraftListResize = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: -3px;
  z-index: 2;
  width: 6px;
  cursor: col-resize;

  &:hover,
  &:focus-visible,
  &:active {
    background-color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledDraftListToolbar = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]};
  border-right: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][500]};
  border-bottom: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledDraftListNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledDraftListCount = styled.span`
  flex-shrink: 0;
  min-width: 3.6rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  text-align: center;
`;

// on the right of its row, or on the left as the row's label
export const StyledDraftListSummary = styled.p<{ $left?: boolean }>`
  margin-left: ${({ $left }) => ($left ? 0 : "auto")};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  text-align: ${({ $left }) => ($left ? "left" : "right")};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledDraftList = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;

  & > * {
    border-right: ${({ theme }) => theme.borderWidth[1]} solid
      ${({ theme }) => theme.color["gray"][500]};
  }
`;

export const StyledDraftListEmpty = styled.p`
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

// below the last row, carries the shared edge down to the bottom
export const StyledDraftListEnd = styled.div`
  flex: 1;
`;

export const StyledDraftListGroup = styled.button`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex-shrink: 0;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
  text-align: left;
  background-color: ${({ theme }) => theme.color["gray"][100]};
  border: none;
  border-bottom: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][300]};
  cursor: pointer;
`;

export const StyledDraftListRow = styled.div<{ $selected: boolean }>`
  /* holds the class bar, which sits on its left edge */
  position: relative;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  min-height: 2.6rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  /* the colors of a Detail tab */
  color: ${({ theme, $selected }) => ($selected ? theme.color["black"] : theme.color["gray"][700])};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color["white"] : theme.color["gray"][100]};
  border-bottom: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][300]};
  cursor: pointer;

  && {
    border-right-color: ${({ $selected }) => ($selected ? "transparent" : "")};
  }

  &:hover,
  &:focus-visible {
    background-color: ${({ theme, $selected }) =>
      $selected ? theme.color["white"] : theme.color["gray"][200]};
  }
`;

export const StyledDraftListLabel = styled.span<{ $leftOut: boolean }>`
  flex: 1;
  text-decoration: ${({ $leftOut }) => ($leftOut ? "line-through" : "none")};
  opacity: ${({ $leftOut }) => ($leftOut ? 0.6 : 1)};
  align-self: center;
  min-width: 0;
  padding: ${({ theme }) => `0 ${theme.space[2]}`};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StyledDraftListMarkers = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding-right: ${({ theme }) => theme.space[1]};
`;

export const StyledDraftListBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-weight: ${({ theme }) => theme.fontWeight["normal"]};
  color: ${({ theme }) => theme.color["mutedText"]};
`;

export const StyledDraftListLeaveOut = styled.button`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["greyer"]};
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;

// between the footer's left and right buttons
export const StyledDraftModeHint = styled.p`
  flex: 1;
  margin: ${({ theme }) => `0 ${theme.space[4]}`};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["mutedText"]};
  text-align: center;
`;

export const StyledHiddenFileInput = styled.input`
  display: none;
`;

// left of the buttons in the footer of the JSON step
export const StyledInputHint = styled(StyledDraftModeHint)`
  margin-left: 0;
  text-align: left;
`;

// striped like the upload area of the documents page
export const StyledLoadArea = styled.button`
  flex-shrink: 0;
  width: 100%;
  height: 3.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["black"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid ${({ theme }) => theme.color["gray"]["400"]};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: pointer;
  background: ${({ theme }) => `
    repeating-linear-gradient(
      -45deg,
      ${theme.color.white},
      ${theme.color.white},
      2px,
      ${theme.color.uploadDocumentBg} 1px,
      ${theme.color.uploadDocumentBg} 12px
    )
  `};

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.color["info"]};
  }
`;

// the list, the Detail and the side column of the selected draft
export const StyledDraftBody = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

// beside the Detail: how the selected draft relates to the database
export const StyledAppendPanel = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[4]};
  width: 23rem;
  min-height: 0;
  margin-left: ${({ theme }) => theme.space[4]};
  overflow-y: auto;
`;

export const StyledAppendSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledAppendHeading = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["black"]};
`;

// one side of a conflict: the value itself is what gets clicked
export const StyledConflictOption = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  text-align: left;
  overflow-wrap: anywhere;
  color: ${({ theme, $selected }) => ($selected ? theme.color["white"] : theme.color["black"])};
  background-color: ${({ theme, $selected }) =>
    $selected ? theme.color["primary"] : theme.color["white"]};
  border: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme, $selected }) => ($selected ? theme.color["primary"] : theme.color["gray"]["400"])};
  border-radius: ${({ theme }) => theme.borderRadius["default"]};
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: ${({ theme }) => theme.color["info"]};
  }
`;

export const StyledConflictSide = styled.span`
  flex-shrink: 0;
  width: 4.5rem;
  opacity: 0.7;
`;

export const StyledAppendText = styled.p`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  overflow-wrap: anywhere;
`;

export const StyledAppendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

export const StyledAppendRowLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

export const StyledProgress = styled.p`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledResult = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["black"]};
`;

export const StyledResultFailure = styled.p`
  color: ${({ theme }) => theme.color["danger"]};
`;

export const StyledIssueSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`;

export const StyledIssueTitle = styled.p<{ $error: boolean }>`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme, $error }) => ($error ? theme.color["danger"] : theme.color["black"])};
`;

export const StyledIssueToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: 0;
  font: inherit;
  text-align: left;
  /* the colors of Detail's section headers, which open the same way */
  color: ${({ theme }) => theme.color["gray"]["600"]};
  background: none;
  border: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.color["primary"]};
  }
`;

export const StyledIssueList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[4]};
  list-style: disc;
`;

// an issue about one draft opens it
export const StyledIssueLink = styled.button`
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

// loop errors span several lines, one per edge
export const StyledIssue = styled.li<{ $error: boolean }>`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme, $error }) => ($error ? theme.color["danger"] : theme.color["greyer"])};
  white-space: pre-wrap;
  word-break: break-word;
`;
