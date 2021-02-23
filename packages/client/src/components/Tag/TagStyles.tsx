import styled from "styled-components";

import { space1, space2 } from "Theme/constants";

interface ITagWrapperStyle {
  hasMarginRight?: boolean;
  logicalType: string;
}
export const TagWrapper = styled.div<ITagWrapperStyle>`
  display: flex;
  border: ${({ theme }) => theme.borderWidths[2]};
  border-style: ${({ logicalType }) =>
    (logicalType === "definitive" && "solid") ||
    (logicalType === "indefinitive" && "dashed") ||
    (logicalType === "hypothetical" && "dotted")};
  border-color: ${({ theme }) => theme.colors["black"]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  overflow: hidden;
  margin-right: ${({ hasMarginRight }) => hasMarginRight && space1};
  max-width: 10rem;
  cursor: move;
  color: ${({ theme }) => theme.colors["black"]};
  font-size: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
  /* height: 25px; */
`;

interface IEntityStyle {
  color: string;
}
export const EntityTag = styled.div<IEntityStyle>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  font-weight: ${({ theme }) => theme.fontWeights["extrabold"]};
  width: 1.5rem;
`;

interface ILabelStyle {
  invertedLabel?: boolean;
  logicalType: string;
}
export const Label = styled.div<ILabelStyle>`
  display: inline;
  vertical-align: middle;
  line-height: 2.6;
  padding: 0 ${space1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["primary"] : theme.colors["white"]};
  color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["white"] : theme.colors["black"]};
  border-left: ${({ theme }) => theme.borderWidths[2]};
  border-left-style: ${({ logicalType }) =>
    (logicalType === "definitive" && "solid") ||
    (logicalType === "indefinitive" && "dashed") ||
    (logicalType === "hypothetical" && "dotted")};
  border-left-color: ${({ theme }) => theme.colors["black"]};
`;

export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  /* height: 100%; */
  cursor: pointer;
`;
