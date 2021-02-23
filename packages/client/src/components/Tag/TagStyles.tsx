import styled from "styled-components";

import { space1, space2 } from "Theme/constants";

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
  max-width: 15rem;
  cursor: move;
  color: black;
  font-size: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
`;

interface IEntityStyle {
  color: string;
}
export const Entity = styled.div<IEntityStyle>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  display: inline;
  padding-top: ${space1};
  padding-bottom: ${space1};
  text-align: center;
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
  padding: ${space1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: ${({ theme, invertedLabel }) =>
    invertedLabel ? theme.colors["primary"] : "white"};
  color: ${({ invertedLabel }) => (invertedLabel ? "white" : "black")};
  border-left: ${({ theme }) => theme.borderWidths[2]};
  border-style: ${({ logicalType }) =>
    (logicalType === "definitive" && "solid") ||
    (logicalType === "indefinitive" && "dashed") ||
    (logicalType === "hypothetical" && "dotted")};
  border-color: ${({ theme }) => theme.colors["primary"]};
`;

export const Button = styled.div`
  display: flex;
  vertical-align: middle;
  margin-top: -${space2};
  margin-bottom: -${space2};
`;
