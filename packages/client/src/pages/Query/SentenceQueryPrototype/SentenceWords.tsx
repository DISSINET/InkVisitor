// PROTOTYPE: renders a sentence with each clause coloured by the noun it
// attaches to.
import React from "react";
import { useTheme } from "styled-components";

import { attachments, clauseById, introducedNouns, Token, tokenText } from "./sentenceGrammar";
import { nounColor, StyledEntityWord, StyledWord } from "./SentenceQueryPrototypeStyles";

interface SentenceWords {
  tokens: Token[];
  // renders the slot of a clause still waiting for its entity
  renderPendingSlot?: (tokenIndex: number) => React.ReactNode;
  // a click on a picked entity empties its slot again
  onClearEntity?: (tokenIndex: number) => void;
}
export const SentenceWords: React.FC<SentenceWords> = ({
  tokens,
  renderPendingSlot,
  onClearEntity,
}) => {
  const theme = useTheme();
  const nouns = introducedNouns(tokens);
  const attachedTo = attachments(tokens);
  const colorOfNoun = (tokenIndex: number) =>
    nounColor(
      theme,
      nouns.findIndex((noun) => noun.tokenIndex === tokenIndex)
    );

  return (
    <>
      {tokens.map((token, tokenIndex) => {
        const color = colorOfNoun(attachedTo[tokenIndex]);
        if (token.kind === "root") {
          return (
            <StyledWord key={tokenIndex} $color={color} $isNoun>
              {tokenText(tokens, tokenIndex)}
            </StyledWord>
          );
        }
        if (token.kind === "focus") {
          return (
            <StyledWord key={tokenIndex} $color={color}>
              {tokenText(tokens, tokenIndex)}
            </StyledWord>
          );
        }
        const clause = clauseById(token.clauseId);
        return (
          <React.Fragment key={tokenIndex}>
            <StyledWord $color={color}>{clause.phrase}</StyledWord>
            {clause.target.kind === "noun" && (
              <StyledWord $color={colorOfNoun(tokenIndex)} $isNoun>
                {tokenText(tokens, tokenIndex).slice(clause.phrase.length + 1)}
              </StyledWord>
            )}
            {clause.target.kind === "entity" &&
              (token.entity ? (
                <StyledEntityWord
                  $color={color}
                  $clickable={!!onClearEntity}
                  onClick={() => onClearEntity?.(tokenIndex)}
                >
                  {token.entity.label}
                  {onClearEntity && " ×"}
                </StyledEntityWord>
              ) : (
                renderPendingSlot?.(tokenIndex)
              ))}
          </React.Fragment>
        );
      })}
    </>
  );
};
