import styled from "styled-components";

export const StyledDocumentTag = styled.div<{
  $size: "sm" | "md" | "lg";
  $width: number | "full";
  $noMargin: boolean;
}>`
  display: flex;
  flex-shrink: 1;
  margin: ${({ $noMargin }) => ($noMargin ? 0 : "0 0.6rem")};
  background-color: ${({ theme }) => theme.color["blue"][400]};
  padding: ${({ theme, $size }) =>
    $size === "sm"
      ? theme.space[1] + " " + theme.space[2]
      : $size === "md"
        ? theme.space[1] + " " + theme.space[3]
        : theme.space[1] + " " + theme.space[4]};
  border-radius: ${({ theme }) => theme.borderRadius["md"]};
  color: white;
  font-size: ${({ theme, $size }) =>
    $size === "sm"
      ? theme.fontSize["xxs"]
      : $size === "md"
        ? theme.fontSize["xs"]
        : theme.fontSize["sm"]};
  align-items: center;
  min-width: 0;
  cursor: copy;
  max-width: ${({ $width }) => ($width === "full" ? "100%" : `${$width / 10}rem`)};
  overflow: hidden !important;
`;

/**
 * Middle ellipsis via two spans: the head carries the ellipsis and absorbs
 * virtually all shrinkage (flex-shrink 999), so the tail — the distinctive
 * suffix of a document name — stays effectively whole until the head is
 * fully collapsed.
 */
export const StyledDocumentTitle = styled.div`
  display: flex;
  overflow: hidden !important;
  min-width: 0;

  flex-shrink: 1;
`;

export const StyledTitleHead = styled.span`
  flex: 0 999 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  /* pre, not nowrap: a split can land beside a space, which nowrap would collapse */
  white-space: pre;
  /* Room for one character plus the "…" — a fully collapsed head would render
     nothing and the tail alone would read as the complete title. */
  min-width: 2ch;
`;

/*
 * The tail's shrink share is a sub-pixel fraction (its scaled flex factor is
 * ~1/10000 of the head's), but any overflow at all makes text-overflow:
 * ellipsis drop whole characters to fit the "…" — the characters this span
 * exists to preserve. Clipping instead loses only that invisible sliver.
 */
export const StyledTitleTail = styled.span`
  flex: 0 1 auto;
  overflow: hidden;
  white-space: pre;
  min-width: 0;
`;
