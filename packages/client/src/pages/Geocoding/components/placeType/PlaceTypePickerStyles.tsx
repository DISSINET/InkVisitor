import styled from "styled-components";

/*
 * The stacking order lives in the theme, as `zIndex` — see the note there. A
 * picker draws over the cards because it can be opened from a control inside
 * one of them, and under a dialog because nothing belonging to a page outranks
 * a dialog opened over it.
 */
export const StyledPickerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${({ theme }) => theme.zIndex.pickerBackdrop};
`;

export const StyledPickerPanel = styled.div<{
  $left: number;
  $top: number;
  $width: number;
  $maxHeight: number;
}>`
  position: fixed;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  width: ${({ $width }) => $width}px;
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: ${({ theme }) => theme.zIndex.picker};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

/**
 * The options, with room above the first and below the last. Only they scroll,
 * so the header never covers the option that has the focus.
 */
export const StyledPickerList = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[1]} 0;
`;

/** Above the options: what is asked, what the answer is recorded as, and what it is about. Its left edge is the options'. */
export const StyledPickerHeader = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

export const StyledPickerHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  min-height: 2.4rem;
`;

/** The question, as an uppercase caption like the page's panel captions. */
export const StyledPickerCaption = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.color["primary"]};
`;

/** "recorded as" and what follows it, at the caption's right. */
export const StyledPickerRecordedAs = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** What the choice is about, under the caption. */
export const StyledPickerNote = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xxs};
  line-height: 1.35;
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** What the answer is recorded as: a Concept's tag, or a relation type and its name. */
export const StyledPickerHeading = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  min-width: 0;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
`;

/** A relation type's name, in the colour the app draws relation types in. */
export const StyledPickerRelation = styled.span`
  color: ${({ theme }) => theme.color["info"]};
`;

/**
 * `$current` is where the value stands; `$suggested` is what the sources called
 * it. They are different claims and are never both the reason to click. Each is
 * a bar drawn inside the option's left edge, so the content keeps the header's
 * left edge whether it is marked or not.
 */
export const StyledPickerOption = styled.button<{ $current?: boolean; $suggested?: boolean }>`
  --picker-mark: ${({ theme, $current, $suggested }) =>
    $current ? theme.color["primary"] : $suggested ? theme.color["warning"] : "transparent"};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  min-height: 3rem;
  text-align: left;
  cursor: pointer;
  border: none;
  box-shadow: inset 3px 0 0 var(--picker-mark);
  background-color: ${({ theme, $current }) =>
    $current ? theme.color["gray"][100] : "transparent"};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};

  svg {
    flex: 0 0 auto;
    font-size: ${({ theme }) => theme.fontSize.lg};
    color: ${({ theme }) => theme.color["greyer"]};
  }

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }

  /* the first option takes the focus when the list opens, so the keyboard can
     start there; the ring is drawn only where the browser judges the keyboard
     in use. The transparent outline is what high-contrast modes, which drop
     shadows, draw instead */
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: -2px;
    background-color: ${({ theme }) => theme.color["gray"][100]};
    box-shadow:
      inset 3px 0 0 var(--picker-mark),
      inset 0 0 0 1px ${({ theme }) => theme.color["primary"]};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.color["gray"][500]};

    svg {
      color: ${({ theme }) => theme.color["gray"][400]};
    }
  }
`;

export const StyledPickerLabel = styled.span`
  display: block;
`;

export const StyledPickerDescription = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The mark on a location type that the place has, at the end of its row. */
export const StyledPickerCheck = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  color: ${({ theme }) => theme.color["primary"]};

  svg {
    font-size: ${({ theme }) => theme.fontSize.base};
    color: inherit;
  }
`;

/** Under the list of a ticked picker, where it is closed from. */
export const StyledPickerFooter = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][400]};
`;

/** One option with, where it has subclasses, the toggle that opens them beside the list. */
export const StyledPickerRow = styled.div`
  display: flex;
  align-items: stretch;
`;

/** Opens the subclasses of an option; the arrow keys and hovering do the same. */
export const StyledSubmenuToggle = styled.button<{ $open: boolean }>`
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  padding: 0;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.color["greyer"]};
  background-color: ${({ theme, $open }) => ($open ? theme.color["gray"][200] : "transparent")};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][200]};
  }
`;

/** The subclasses of an option, beside the list it is in. Fixed to the viewport, so the list's own scrolling does not clip it. */
export const StyledPickerSubmenu = styled.div<{
  $left: number;
  $top: number;
  $width: number;
  $maxHeight: number;
}>`
  position: fixed;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  width: ${({ $width }) => $width}px;
  max-height: ${({ $maxHeight }) => $maxHeight}px;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space[1]} 0;
  z-index: ${({ theme }) => theme.zIndex.picker};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

/** What is said beside the tag: that the sources call it this, or that it is the favourite. */
export const StyledPickerAside = styled.span`
  margin-left: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/** The tag and what is said beside it, on one line. */
export const StyledPickerHead = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
`;
