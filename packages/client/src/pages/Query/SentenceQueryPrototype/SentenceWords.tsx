// PROTOTYPE: renders a sentence with each clause coloured by the noun it
// attaches to.
import { Checkbox } from "components";
import { EntityTag } from "components/advanced";
import React from "react";
import { useTheme } from "styled-components";

import {
  attachments,
  clauseById,
  introducedNouns,
  subordinatesApply,
  Token,
  tokenText,
  Widening,
  wideningPhrase,
} from "./sentenceGrammar";
import { nounColor, StyledWord } from "./SentenceQueryPrototypeStyles";

interface SentenceWords {
  tokens: Token[];
  // renders the slot of a clause still waiting for its entity
  renderPendingSlot?: (tokenIndex: number) => React.ReactNode;
  // the unlink button of a picked entity empties its slot again
  onClearEntity?: (tokenIndex: number) => void;
  // EQ / SUB of a picked entity, shown as toggles right after it
  onWiden?: (tokenIndex: number, widening: Widening, value: boolean) => void;
}
export const SentenceWords: React.FC<SentenceWords> = ({
  tokens,
  renderPendingSlot,
  onClearEntity,
  onWiden,
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
                <EntityTag
                  entity={token.entity.entity}
                  tagMaxWidth={200}
                  disableDrag
                  unlinkButton={
                    onClearEntity ? { onClick: () => onClearEntity(tokenIndex) } : false
                  }
                />
              ) : (
                renderPendingSlot?.(tokenIndex)
              ))}
            {clause.target.kind === "entity" && token.entity && onWiden && (
              <>
                <Checkbox
                  label={wideningPhrase(clause, "equivalents")}
                  size={14}
                  value={!!token.entity.includeEquivalents}
                  onChangeFn={(value) => onWiden(tokenIndex, "equivalents", value)}
                  disableEnterKey
                />
                {subordinatesApply(clause) && (
                  <Checkbox
                    label={wideningPhrase(clause, "subordinates")}
                    size={14}
                    value={!!token.entity.includeSubordinates}
                    onChangeFn={(value) => onWiden(tokenIndex, "subordinates", value)}
                    disableEnterKey
                  />
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
