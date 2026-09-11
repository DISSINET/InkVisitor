import { animated } from "@react-spring/web";
import { InvertedBgColor } from "Theme/theme";
import styled from "styled-components";

export const StyledMenuGroup = styled(animated.div)`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 18rem;
  max-width: 30rem;
  padding: ${({ theme }) => theme.space[1]};
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
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

export const StyledItemLabel = styled.span`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
