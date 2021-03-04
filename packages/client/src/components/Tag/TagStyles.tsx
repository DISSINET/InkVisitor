import styled from "styled-components";

import { space1, space2, space4, space48 } from "Theme/constants";

interface ITagWrapperStyle {
  hasMarginRight?: boolean;
  logicalType: string;
}
export const TagWrapper = styled.div<ITagWrapperStyle>`
  display: inline-flex;
  border: ${({ theme }) => theme.borderWidths[2]};
  border-style: ${({ logicalType }) =>
    (logicalType === "definitive" && "solid") ||
    (logicalType === "indefinitive" && "dashed") ||
    (logicalType === "hypothetical" && "dotted")};
  border-color: black;
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  overflow: hidden;
  margin-right: ${({ hasMarginRight }) => hasMarginRight && space1};
  max-width: ${space48};
  cursor: move;
  color: black;
  font-size: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
`;

interface IEntityStyle {
  color: string;
}
export const EntityTag = styled.div<IEntityStyle>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  padding: 0 ${space4};
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
  padding: ${space1} ${space2};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["primary"] : "white"};
  color: ${({ invertedLabel }) => (invertedLabel ? "white" : "black")};
  border-left: ${({ theme }) => theme.borderWidths[2]};
  border-left-style: ${({ logicalType }) =>
    (logicalType === "definitive" && "solid") ||
    (logicalType === "indefinitive" && "dashed") ||
    (logicalType === "hypothetical" && "dotted")};
  border-left-color: ${({ theme }) => theme.colors["primary"]};
`;

export const ButtonWrapper = styled.div`
  display: flex;
  vertical-align: middle;
  margin-top: -${space2};
  margin-bottom: -0.4rem;
`;
