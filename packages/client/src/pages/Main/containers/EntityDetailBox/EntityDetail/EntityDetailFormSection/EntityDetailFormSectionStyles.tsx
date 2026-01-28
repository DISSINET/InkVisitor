import { IoClose, IoStar, IoStarOutline } from "react-icons/io5";
import styled from "styled-components";

export const StyledAlternativeLabels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
interface StyledAlternativeLabelWrapProps {
  $isEditing: boolean;
}
export const StyledAlternativeLabelWrap = styled.div<StyledAlternativeLabelWrapProps>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  height: 2.2rem;
  padding-left: 0.2rem;
  padding-right: ${({ $isEditing }) => ($isEditing ? "0" : "0.3rem")};
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  border-radius: 0.35rem;
  flex-basis: ${({ $isEditing }) => ($isEditing ? "100%" : "auto")};
  min-width: ${({ $isEditing }) => ($isEditing ? "100%" : "auto")};
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s ease, border-color 0.2s ease,
    box-shadow 0.2s ease;
  cursor: editable;

  &:hover {
    border-color: ${({ theme }) => theme.color["primary"]};
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledGreyBar = styled.div`
  position: absolute;
  width: 0.3rem;
  background-color: ${({ theme }) => theme.color["gray"][300]};
  top: 0;
  bottom: 0;
  left: 0;
  transition: background-color 0.2s ease;
  border-radius: 0.25rem 0 0 0.25rem;

  ${StyledAlternativeLabelWrap}:hover &,
  ${StyledAlternativeLabelWrap}:focus-within & {
    background-color: ${({ theme }) => theme.color["primary"]};
  }
`;
export const StyledAlternativeLabel = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  margin-left: 0.5rem;
  z-index: 1;
  transition: color 0.2s ease;

  ${StyledAlternativeLabelWrap}:hover & {
    color: ${({ theme }) => theme.color["primary"]};
  }
`;

export const StyledAlternativeLabelButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding-left: 0.6rem;
`;

export const StyledCloseIcon = styled(IoClose)`
  cursor: pointer;
  color: ${({ theme }) => theme.color["black"]};
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }

  ${StyledAlternativeLabelWrap}:hover & {
    transform: scale(1.05);
  }
`;
export const StyledPromoteIcon = styled.div`
  position: relative;
  display: inline-flex;
  width: 1.2rem;
  height: 1.2rem;
  margin-bottom: 0.15rem;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }

  svg {
    position: absolute;
    pointer-events: none;
    height: 100%;
    top: 0;
    left: 0;
  }
`;

export const StyledPromoteIconOutline = styled(IoStarOutline)`
  color: ${({ theme }) => theme.color["black"]};
  transition: opacity 0.2s ease;
  opacity: 1;

  ${StyledPromoteIcon}:hover & {
    opacity: 0;
  }
`;

export const StyledPromoteIconFilled = styled.div`
  transition: opacity 0.2s ease;
  opacity: 0;

  ${StyledPromoteIcon}:hover & {
    opacity: 1;
  }

  /* Ensure tooltip works even when icon is transitioning */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  & > div {
    width: 100%;
    height: 100%;
    pointer-events: auto;
  }
`;
interface StyledAddLabel {
  $marginTop: boolean;
}
export const StyledAddLabel = styled.div<StyledAddLabel>`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: ${({ $marginTop }) => ($marginTop ? "1.5rem" : "")};
`;

export const StyledDangerOnHoverButton = styled.div`
  display: flex;
  align-items: center;
  & > button {
    border-color: ${({ theme }) => theme.color["black"]} !important;
    color: ${({ theme }) => theme.color["black"]} !important;
    transition: border-color 0.2s, color 0.2s, background-color 0.2s;

    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.color["danger"]} !important;
      color: ${({ theme }) => theme.color["danger"]} !important;
    }
  }
`;
