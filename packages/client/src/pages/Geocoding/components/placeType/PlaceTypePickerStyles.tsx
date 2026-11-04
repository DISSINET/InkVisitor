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
