import { InvertedBgColor } from "Theme/theme";
import styled from "styled-components";

export const StyledMenuGroupWrapper = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  padding-top: ${({ theme }) => theme.space[4]};

  z-index: 10001;
  min-width: 20rem;
`;

export const StyledMenuGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color.gray[400]};
  box-shadow: 0 4px 12px ${({ theme }) => theme.color.menuShadow};
  border-radius: 0.9rem;
  overflow: hidden;
  padding: 0.5rem;
`;

interface StyledMenuItem {
  $color?: keyof InvertedBgColor;
}
export const StyledMenuItem = styled.div<StyledMenuItem>`
  height: 3.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  border-radius: 0.5rem;
  color: ${({ theme }) => theme.color.black};
  background-color: ${({ theme }) => theme.color.white};
  transition:
    color 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    color: ${({ theme, $color }) => ($color ? theme.color[$color] : theme.color.black)};
    background-color: ${({ theme, $color }) =>
      $color ? theme.color.invertedBg[$color] : theme.color.menuHover};
  }

  svg {
    vertical-align: middle;
  }
`;

export const StyledIcon = styled.div`
  width: 3.4rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const StyledMenuItemLabel = styled.span`
  padding-top: 1px;
`;

export const StyledMenuDivider = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.color.gray[300]};
  margin: 0.35rem 0;
`;
