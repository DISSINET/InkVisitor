import styled, { DefaultTheme } from "styled-components";

/**
 * The colour a gazetteer is drawn in, or a neutral one for a source the theme
 * has never heard of — the engine's list grows, and an unknown slug reads better
 * as plain than as whichever colour a fallback happened to land on.
 */
export const sourceColor = (theme: DefaultTheme, source: string) =>
  theme.color["gazetteer"][source as keyof typeof theme.color.gazetteer] || theme.color["greyer"];

/**
 * `$borderStyle` carries how the source matched the name: a continuous line
 * where the name is the one searched for, broken as the claim weakens. One
 * weight throughout, because a thicker border reads as a heavier tag rather than
 * a better match. Drawn rather than written — see MatchTag.
 */
export const StyledMatchTag = styled.span<{
  $source: string;
  $borderStyle: string;
  $faded?: boolean;
}>`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[1]};
  max-width: 100%;
  padding: 0 ${({ theme }) => theme.space[1]};
  /* neutral, because the hue is already printed inside the tag on the slug: a
     coloured hairline repeating it made sixteen colours into thirty-two marks */
  border: 1px ${({ $borderStyle }) => $borderStyle} ${({ theme }) => theme.color["gray"][300]};
  opacity: ${({ $faded }) => ($faded ? 0.65 : 1)};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  line-height: 1.6;
`;

export const StyledMatchTagSource = styled.span<{ $source: string }>`
  flex: 0 0 auto;
  font-family: monospace;
  color: ${({ theme, $source }) => sourceColor(theme, $source)};
`;

export const StyledMatchTagName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.color["black"]};

  a {
    color: inherit;
  }
`;
