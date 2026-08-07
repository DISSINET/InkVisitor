import styled, { css } from "styled-components";

const getWidth = (width?: number | "full") => {
  if (width) {
    return width === "full" ? "100%" : `${width / 10}rem`;
  } else {
    return "auto";
  }
};

interface StyledDropdownWrap {
  $width?: number | "full";
}
export const StyledDropdownWrap = styled.div<StyledDropdownWrap>`
  position: relative;
  display: inline-flex;
  vertical-align: bottom;
  max-width: 100%;
  width: ${({ $width }) => getWidth($width)};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

interface StyledControl {
  $focused?: boolean;
  $disabled?: boolean;
  $disabledAppearance?: "stripes" | "quiet";
  $suggester?: boolean;
}
export const StyledControl = styled.div<StyledControl>`
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 100%;
  min-height: ${({ theme }) => theme.space[10]};
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  border-width: 1px;
  border-style: solid;
  background-color: ${({ theme }) => theme.color["white"]};
  border-color: ${({ theme, $focused }) =>
    $focused ? theme.color["info"] : theme.color["gray"]["400"]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  box-shadow: ${({ theme, $focused }) =>
    $focused
      ? `inset 0 0 0 ${theme.borderWidth[1]} ${theme.color["info"]}`
      : "none"};
  &:hover {
    border-color: ${({ theme, $disabled }) =>
      $disabled ? "" : theme.color["info"]};
  }

  /* pointer-events also blocks mouse-focus, so a disabled control can never
     open its menu via click-then-ArrowDown; the wrapper still gets hover
     events for the tooltip */
  ${({ $disabled, $disabledAppearance, theme }) =>
    $disabled &&
    css`
      pointer-events: none;
      background: ${$disabledAppearance === "quiet"
        ? theme.color["white"]
        : theme.background["stripes"]};
    `}

  /* In the suggester the class box merges with the input into one white field;
     the entity-class colour band (TypeBar) carries the class identity. */
  ${({ $suggester, $disabled, theme }) =>
    $suggester &&
    css`
      border-color: transparent;
      border-right: none;
      border-radius: 0;
      box-shadow: none;
      &:hover {
        border-color: transparent;
      }
      ${$disabled && `background: transparent;`}
    `}
`;

export const StyledControlIcon = styled.div`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  margin-left: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["greyer"]};
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

interface StyledValueArea {
  $density?: "default" | "compact";
  $suggester?: boolean;
}
export const StyledValueArea = styled.div<StyledValueArea>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  overflow: hidden;
  padding: ${({ $density, theme }) =>
    $density === "compact" ? theme.space[1] : "0"};
  gap: ${({ $density }) => ($density === "compact" ? "0.2rem" : "0")};
  align-content: ${({ $density }) =>
    $density === "compact" ? "flex-start" : ""};
  /* suggester class box is sized for a single letter — never wrap/overflow it */
  ${({ $suggester }) =>
    $suggester &&
    css`
      flex-wrap: nowrap;
      overflow: hidden;
    `}
`;

export const StyledPlaceholder = styled.div`
  color: ${({ theme }) => theme.color["gray"][500]};
  margin-left: ${({ theme }) => theme.space[2]};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface StyledSingleValue {
  $suggester?: boolean;
}
export const StyledSingleValue = styled.div<StyledSingleValue>`
  display: flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.color["primary"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ $suggester }) => ($suggester ? "bold" : "inherit")};
  margin-left: ${({ theme, $suggester }) =>
    $suggester ? theme.space[4] : theme.space[2]};
  transform: ${({ $suggester }) => ($suggester ? "translateY(-6%)" : "")};
`;

/* Chip shell: layout + remove button only. Visual identity (background,
   border, padding) lives in the chip BODY components so each variant fully
   owns its look without flags. */
export const StyledChipShell = styled.div`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  margin: 1px;
`;

export const StyledDefaultChipBody = styled.div`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  background-color: ${({ theme }) => theme.color["invertedBg"]["primary"]};
  border: 1px solid ${({ theme }) => theme.color["blue"][300]};
  border-radius: 1px;
  color: ${({ theme }) => theme.color["black"]};
  padding: 0.2rem;
`;

export const StyledChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0 0.2rem;
  color: ${({ theme }) => theme.color["black"]};
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledChipOverflow = styled.div`
  padding: 0.2rem 0.2rem 0.2rem 0.3rem;
  color: ${({ theme }) => theme.color["primary"]};
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

interface StyledSearchInput {
  $chars: number;
  $suggester?: boolean;
}
export const StyledSearchInput = styled.input<StyledSearchInput>`
  border: none;
  outline: none;
  background: transparent;
  font-size: inherit;
  font-family: inherit;
  color: ${({ theme }) => theme.color["black"]};
  margin-left: ${({ theme, $suggester, $chars }) =>
    $suggester || $chars === 0 ? "0" : theme.space[2]};
  padding: 0;
  min-width: ${({ $chars }) => ($chars === 0 ? "0" : "2px")};
  width: ${({ $chars }) => ($chars === 0 ? "2px" : `${$chars}ch`)};
`;

export const StyledIndicators = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledClear = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0.2rem;
  color: ${({ theme }) => theme.color["primary"]};
`;

interface StyledChevron {
  $suggester?: boolean;
}
export const StyledChevron = styled.div<StyledChevron>`
  display: flex;
  align-items: center;
  padding: ${({ theme, $suggester }) => ($suggester ? "0" : theme.space[2])};
  padding-right: ${({ $suggester }) => ($suggester ? "0.3rem" : "0.4rem")};
  color: ${({ theme }) => theme.color["primary"]};
`;

/* ---- portalled menu (styles co-located; the old ones lived in Theme/global.ts) ---- */

export const StyledMenu = styled.div`
  /* body-level stacking (portal root makes no context): match the other
     floating portal menus (Tooltip, DatePicker, Suggester) so the menu
     clears modals and this component's own tooltip */
  z-index: 10000;
  overflow-y: auto;
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

interface StyledOption {
  $highlighted?: boolean;
  $selected?: boolean;
  $disabled?: boolean;
}
export const StyledOption = styled.div<StyledOption>`
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  background-color: ${({ theme, $highlighted }) =>
    $highlighted ? theme.color["invertedBg"]["primary"] : theme.color["white"]};
  font-weight: ${({ $selected }) => ($selected ? "bold" : "normal")};
  color: ${({ theme, $disabled }) =>
    $disabled ? theme.color["gray"][500] : theme.color["black"]};
  &:hover {
    background-color: ${({ theme, $disabled }) =>
      $disabled ? "" : theme.color["invertedBg"]["primary"]};
  }
`;

/* default option row — variants replace this entirely via renderOption */
export const StyledDefaultOptionRow = styled.div`
  display: flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.8rem 1.2rem;
`;

export const StyledNoOptions = styled.div`
  padding: 0.8rem 1.2rem;
  color: ${({ theme }) => theme.color["gray"][500]};
`;
