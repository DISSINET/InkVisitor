import { animated } from "@react-spring/web";
import { InvertedBgColor } from "Theme/theme";
import styled, { css } from "styled-components";

// The line box trims to the cap height, so centring the box centres the glyphs
// on the icons whatever ascent and descent the font reserves. Descenders hang
// below the trimmed box, so it must not clip vertically.
const capCentered = css`
  line-height: 1;
  text-box: trim-both cap alphabetic;
`;

// Ellipsis without vertical clipping, which would cut the descenders off. A
// clipping flex item keeps its text width as its minimum unless told otherwise.
const singleLineEllipsis = css`
  min-width: 0;
  overflow-x: clip;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

// tags render inside modals (500) and inside the suggester dropdown (10000),
// and the menu has to clear whichever one it was opened from
const MENU_Z_INDEX = 10002;

export const StyledMenuFloating = styled.div<{ $submenu?: boolean }>`
  z-index: ${({ $submenu }) => ($submenu ? MENU_Z_INDEX + 1 : MENU_Z_INDEX)};
`;

export const StyledMenuGroup = styled(animated.div)`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 18rem;
  max-width: 30rem;
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: 0 4px 12px ${({ theme }) => theme.color["menuShadow"]};
`;

export const StyledMenuHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

export const StyledMenuHeaderLabel = styled.span`
  ${singleLineEllipsis}
  ${capCentered}
`;

interface StyledMenuItem {
  $color?: keyof InvertedBgColor;
}
export const StyledMenuItem = styled.div<StyledMenuItem>`
  display: flex;
  align-items: center;
  height: 2.6rem;
  padding-right: ${({ theme }) => theme.space[2]};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    color: ${({ theme, $color }) => ($color ? theme.color[$color] : theme.color["black"])};
    background-color: ${({ theme, $color }) =>
      $color ? theme.color["invertedBg"][$color] : theme.color["menuHover"]};
  }

  svg {
    vertical-align: middle;
  }
`;

export const StyledItemIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 2.8rem;
  flex-shrink: 0;
`;

// a text glyph rather than an icon, matching how the annotator's context menu
// marks a toggled-on row
export const StyledCheckGlyph = styled.span`
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  line-height: 1;
`;

export const StyledItemLabel = styled.span`
  ${singleLineEllipsis}
  ${capCentered}
`;

// pushes the submenu caret (and the bookmarked-count badge) to the trailing edge
export const StyledItemTrailing = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  margin-left: auto;
  padding-left: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.color["gray"][600]};
`;

export const StyledItemCount = styled.span`
  ${capCentered}
`;

export const StyledMenuDivider = styled.div`
  height: 1px;
  margin: ${({ theme }) => theme.space[1]} 0;
  background-color: ${({ theme }) => theme.color["gray"][300]};
`;

export const StyledEmptyNote = styled.div`
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  font-style: italic;
  color: ${({ theme }) => theme.color["gray"][600]};
`;
