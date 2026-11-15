// PROTOTYPE: renders a sentence with each clause coloured by the noun it
// attaches to.
import { EntityTag } from "components/advanced";
import React from "react";
import { useTheme } from "styled-components";
import { IcoClose } from "Theme/icons";

import {
  attachments,
  clauseById,
  introducedNouns,
  Token,
  tokenText,
  Widening,
  wideningPhrase,
  widenings,
} from "./sentenceGrammar";
import {
  nounColor,
  StyledPart,
  StyledRemoveButton,
  StyledSwappableWord,
  StyledWord,
} from "./SentenceQueryPrototypeStyles";

interface SentenceWords {
  tokens: Token[];
  // renders the slot of a clause still waiting for its entity
  renderPendingSlot?: (tokenIndex: number) => React.ReactNode;
  // the unlink button of a picked entity empties its slot again
  onClearEntity?: (tokenIndex: number) => void;
  // EQ / SUB of a picked entity; the ones on show right after it, with a ×
  onWiden?: (tokenIndex: number, widening: Widening, value: boolean) => void;
  // a click on the root noun or a clause's phrase opens its alternatives
  onOpenSwap?: (tokenIndex: number) => void;
  swapIndex?: number;
  renderSwapMenu?: (tokenIndex: number) => React.ReactNode;
  // the × of a clause or an "and those X"
  onRemove?: (tokenIndex: number) => void;
}
export const SentenceWords: React.FC<SentenceWords> = ({
  tokens,
  renderPendingSlot,
  onClearEntity,
  onWiden,
  onOpenSwap,
  swapIndex,
  renderSwapMenu,
  onRemove,
}) => {
  const theme = useTheme();
  const nouns = introducedNouns(tokens);
  const attachedTo = attachments(tokens);
  const colorOfNoun = (tokenIndex: number) =>
    nounColor(
      theme,
      nouns.findIndex((noun) => noun.tokenIndex === tokenIndex)
    );

  const swappable = (tokenIndex: number, color: string, text: string, isNoun?: boolean) =>
    onOpenSwap ? (
      <StyledSwappableWord
        $color={color}
        $isNoun={isNoun}
        $isOpen={swapIndex === tokenIndex}
        // a mousedown here is not an outside click for the open menu
        data-swap-target
        onMouseDown={(e) => {
          e.preventDefault();
          onOpenSwap(tokenIndex);
        }}
      >
        {text}
      </StyledSwappableWord>
    ) : (
      <StyledWord $color={color} $isNoun={isNoun}>
        {text}
      </StyledWord>
    );

  const removeButton = (tokenIndex: number) =>
    onRemove && (
      <StyledRemoveButton
        aria-label="remove"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onRemove(tokenIndex)}
      >
        <IcoClose size={14} />
      </StyledRemoveButton>
    );

  return (
    <>
      {tokens.map((token, tokenIndex) => {
        const color = colorOfNoun(attachedTo[tokenIndex]);
        if (token.kind === "root") {
          return (
            <StyledPart key={tokenIndex}>
              {swappable(tokenIndex, color, tokenText(tokens, tokenIndex), true)}
              {swapIndex === tokenIndex && renderSwapMenu?.(tokenIndex)}
            </StyledPart>
          );
        }
        if (token.kind === "focus") {
          return (
            <StyledPart key={tokenIndex}>
              <StyledWord $color={color}>{tokenText(tokens, tokenIndex)}</StyledWord>
              {removeButton(tokenIndex)}
            </StyledPart>
          );
        }
        const clause = clauseById(token.clauseId);
        return (
          <StyledPart key={tokenIndex}>
            {swappable(tokenIndex, color, clause.phrase)}
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
            {token.entity &&
              widenings(clause, token.entity, true).map((widening) => (
                <React.Fragment key={widening}>
                  <StyledWord $color={color}>{wideningPhrase(clause, widening)}</StyledWord>
                  {onWiden && (
                    <StyledRemoveButton
                      aria-label="remove"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onWiden(tokenIndex, widening, false)}
                    >
                      <IcoClose size={14} />
                    </StyledRemoveButton>
                  )}
                </React.Fragment>
              ))}
            {removeButton(tokenIndex)}
            {swapIndex === tokenIndex && renderSwapMenu?.(tokenIndex)}
          </StyledPart>
        );
      })}
    </>
  );
};
