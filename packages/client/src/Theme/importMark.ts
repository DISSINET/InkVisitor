import { ImportMark } from "hooks/useEntityEditing";
import { css } from "styled-components";

/**
 * A stripe on the left of what an append adds to a stored entity, dashed for
 * a stored relation edited in the drafts, and a tint under what is added. Both
 * are background layers, so the marked row keeps its size.
 */
export const importMarkCss = css<{ $importMark?: ImportMark }>`
  ${({ $importMark, theme }) =>
    $importMark === "added" &&
    css`
      padding-left: ${theme.space[2]};
      background:
        linear-gradient(${theme.color["success"]}, ${theme.color["success"]}) left / 3px 100%
          no-repeat,
        ${theme.color.invertedBg["success"]};
    `}
  ${({ $importMark, theme }) =>
    $importMark === "changed" &&
    css`
      padding-left: ${theme.space[2]};
      background: repeating-linear-gradient(
          to bottom,
          ${theme.color["success"]} 0 4px,
          transparent 4px 7px
        )
        left / 3px 100% no-repeat;
    `}
`;
