import { IoClose, IoStar, IoStarOutline } from "react-icons/io5";
import styled from "styled-components";

export const StyledAlternativeLabels = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
export const StyledAlternativeLabelWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 2.4rem;
  padding-left: 0.2rem;
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["black"]};
  background-color: ${({ theme }) => theme.color["white"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  border-radius: 0.35rem;
  gap: 0.15rem;
  padding-right: 0.5rem;
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

  ${StyledAlternativeLabelWrap}:hover &,
  ${StyledAlternativeLabelWrap}:focus-within & {
    background-color: ${({ theme }) => theme.color["primary"]};
  }
`;
export const StyledAlternativeLabel = styled.div`
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;

  display: flex;
  align-items: center;
  margin-left: 0.5rem;
  padding-right: 0.3rem;
  z-index: 1;
  transition: color 0.2s ease;

  ${StyledAlternativeLabelWrap}:hover & {
    color: ${({ theme }) => theme.color["primary"]};
  }
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

export const StyledPromoteIconFilled = styled(IoStar)`
  color: ${({ theme }) => theme.color["warning"]};
  transition: opacity 0.2s ease;
  opacity: 0;

  ${StyledPromoteIcon}:hover & {
    opacity: 1;
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
