import styled from "styled-components";

import { space1 } from "Theme/constants";

interface ITagWrapperStyle {
  hasMarginRight?: boolean;
}
export const TagWrapper = styled.div<ITagWrapperStyle>`
  display: inline-flex;
  border: ${({ theme }) => theme.borderWidths[2]} solid black;
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  overflow: hidden;
  margin-right: ${({ hasMarginRight }) => hasMarginRight && space1};
  max-width: 20rem;
  cursor: move;
  color: black;
  font-size: 10px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4);
`;
interface IEntityStyle {
  color: string;
  label?: boolean;
  showLabel?: boolean;
}
export const Entity = styled.div<IEntityStyle>`
  background-color: ${({ color, theme }) => theme.colors[color]};
  display: inline;
  padding-top: ${space1};
  padding-bottom: ${space1};
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeights["extrabold"]};
  width: 1.5rem;
  border-right: ${({ theme, label, showLabel }) =>
      !!label && !!showLabel ? theme.borderWidths[2] : 0}
    solid;
  border-color: ${({ theme, label, showLabel }) =>
    !!label && !!showLabel && theme.colors["primary"]};
`;
interface ILabelStyle {
  invertedLabel?: boolean;
}
export const Label = styled.div<ILabelStyle>`
  display: inline;
  vertical-align: middle;
  padding: ${space1};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Button = styled.div`
  display: flex;
  vertical-align: middle;
`;
