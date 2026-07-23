import styled from "styled-components";

export const StyledFolderWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.space[0]};
  width: 100%;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  background-color: ${({ theme }) => theme.color["white"]};
  overflow: hidden;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
    border-color: ${({ theme }) => theme.color["gray"][450]};
    box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
export const StyledFolderHeader = styled.div`
  width: 100%;
  height: ${({ theme }) => theme.space[14]};
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  color: ${({ theme }) => theme.color["gray"][700]};
  padding: ${({ theme }) => theme.space[3]};
`;
export const StyledFolderWrapperOpenArea = styled.div`
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;
interface StyledIconWrapProps {
  $isOpen: boolean;
}
export const StyledIconWrap = styled.div<StyledIconWrapProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ theme }) => theme.space[9]};
  height: ${({ theme }) => theme.space[9]};
  border-radius: ${({ theme }) => theme.borderRadius["rounded-md"]};
  scale: ${({ $isOpen }) => ($isOpen ? 1.1 : 1)};
  transition: scale 0.2s ease;

  ${StyledFolderHeader}:hover & {
    scale: 1.1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
export const StyledFolderHeaderText = styled.div<{ $open?: boolean }>`
  flex: 1;
  min-width: 0;
  margin-left: ${({ theme }) => theme.space[2]};
  font-weight: ${({ theme, $open }) =>
    $open ? theme.fontWeight["bold"] : theme.fontWeight["medium"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme, $open }) => ($open ? theme.color["primary"] : theme.color["gray"][700])};
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;
export const StyledFolderHeaderButtons = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  transition:
    max-width 0.2s ease,
    opacity 0.15s ease;

  ${StyledFolderHeader}:hover &,
  ${StyledFolderHeader}:focus-within & {
    max-width: ${({ theme }) => theme.space[24]};
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
export const StyledFolderContent = styled.div`
  padding: ${({ theme }) => theme.space[3]};
`;

export const StyledFolderContentTags = styled.div`
  display: block;
  padding-bottom: ${({ theme }) => theme.space[6]};
`;
export const StyledFolderContentTag = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  display: inline-block;
`;
export const StyledFolderSuggester = styled.div``;

export const StyledEditButtonWrap = styled.div`
  display: flex;
  align-items: center;

  &:hover button {
    color: ${({ theme }) => theme.color["warning"]};
  }
`;

export const StyledRemoveButtonWrap = styled.div`
  display: flex;
  align-items: center;

  &:hover button {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;
