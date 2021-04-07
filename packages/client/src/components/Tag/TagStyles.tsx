import styled from "styled-components";

interface TagWrapper {
  hasMarginRight?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
}
export const TagWrapper = styled.div<TagWrapper>`
  display: inline-flex;
  border: ${({ theme }) => theme.borderWidths[2]};
  border-style: ${({ borderStyle }) => borderStyle};
  border-color: ${({ theme }) => theme.colors["black"]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  overflow: hidden;
  margin-right: ${({ theme, hasMarginRight }) =>
    hasMarginRight && theme.space[1]};
  cursor: move;
  color: ${({ theme }) => theme.colors["black"]};
  font-size: ${({ theme }) => theme.fontSizes["xxs"]};
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  height: 2.25rem;
`;

interface EntityTag {
  color: string;
}
export const EntityTag = styled.div<EntityTag>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-weight: ${({ theme }) => theme.fontWeights["extrabold"]};
  width: ${({ theme }) => theme.space[7]};
`;

interface Label {
  invertedLabel?: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
}
export const Label = styled.div<Label>`
  display: inline-block;
  vertical-align: middle;
  overflow: hidden !important;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["primary"] : theme.colors["white"]};
  color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["white"] : theme.colors["black"]};
  border-left-width: ${({ theme }) => theme.borderWidths[2]};
  border-left-style: ${({ borderStyle }) => borderStyle};
  border-left-color: ${({ theme }) => theme.colors["black"]};
  max-width: ${({ theme }) => theme.space[52]};
`;

export const ButtonWrapper = styled.div`
  display: flex;
`;
