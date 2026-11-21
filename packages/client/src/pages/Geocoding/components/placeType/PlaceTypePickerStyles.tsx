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
  overflow-y: auto;
  z-index: ${({ theme }) => theme.zIndex.picker};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

/** The options as a list for assistive technology, laid out as if it were not there. */
export const StyledPickerList = styled.div`
  display: contents;
`;

export const StyledPickerTitle = styled.div`
  position: sticky;
  top: 0;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  border-bottom: 1px solid ${({ theme }) => theme.color["gray"][400]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  color: ${({ theme }) => theme.color["greyer"]};
`;

/**
 * `$current` is where the value stands; `$suggested` is what the sources called
 * it. They are different claims and are never both the reason to click.
 */
export const StyledPickerOption = styled.button<{ $current?: boolean; $suggested?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  width: 100%;
  text-align: left;
  cursor: pointer;
  border: none;
  border-left: 3px solid
    ${({ theme, $current, $suggested }) =>
      $current ? theme.color["primary"] : $suggested ? theme.color["warning"] : "transparent"};
  background-color: ${({ theme, $current }) =>
    $current ? theme.color["gray"][100] : "transparent"};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color["black"]};

  svg {
    flex: 0 0 auto;
    margin-top: 0.1rem;
    font-size: ${({ theme }) => theme.fontSize.lg};
    color: ${({ theme }) => theme.color["greyer"]};
  }

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.color["gray"][100]};
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
    margin-top: 0;
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
