// PROTOTYPE: renders a sentence with each clause coloured by the noun it
// attaches to.
import { EntityTag } from "components/advanced";
import React from "react";
import { useTheme } from "styled-components";
import { IcoClose } from "Theme/icons";

import {
  attachments,
  clauseById,
  connectives,
  introducedNouns,
  operatorOf,
  Token,
  tokenText,
  Widening,
  wideningPhrase,
  widenings,
} from "./sentenceGrammar";
import {
  nounColor,
  StyledPart,
  StyledCaretSlot,
  StyledOperatorWord,
  StyledRemoveButton,
  StyledSwappableWord,
  StyledWord,
} from "./SentenceQueryPrototypeStyles";

export interface PartMenu {
  tokenIndex: number;
  kind: "swap" | "widen";
}
const isOpen = (openMenu: PartMenu | undefined, tokenIndex: number, kind: PartMenu["kind"]) =>
  openMenu?.tokenIndex === tokenIndex && openMenu.kind === kind;

interface SentenceWords {
  tokens: Token[];
  // renders the slot of a clause still waiting for its entity
  renderPendingSlot?: (tokenIndex: number) => React.ReactNode;
  // the unlink button of a picked entity empties its slot again
  onClearEntity?: (tokenIndex: number) => void;
  // EQ / SUB of a picked entity; the ones on show right after it, with a ×
  onWiden?: (tokenIndex: number, widening: Widening, value: boolean) => void;
  // a click on the root noun or a clause's phrase opens its alternatives, a
  // click right after a picked entity its EQ / SUB
  openMenu?: PartMenu;
  onOpenMenu?: (menu: PartMenu) => void;
  renderMenu?: (menu: PartMenu) => React.ReactNode;
  // flips AND / OR of the noun introduced at `nounTokenIndex`
  onToggleOperator?: (nounTokenIndex: number) => void;
  // the × of a clause or an "and those X"
  onRemove?: (tokenIndex: number) => void;
}
export const SentenceWords: React.FC<SentenceWords> = ({
  tokens,
  renderPendingSlot,
  onClearEntity,
  onWiden,
  openMenu,
  onOpenMenu,
  renderMenu,
  onToggleOperator,
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
    onOpenMenu ? (
      <StyledSwappableWord
        $color={color}
        $isNoun={isNoun}
        $isOpen={isOpen(openMenu, tokenIndex, "swap")}
        // a mousedown here is not an outside click for the open menu
        data-swap-target
        onMouseDown={(e) => {
          e.preventDefault();
          onOpenMenu({ tokenIndex, kind: "swap" });
        }}
      >
        {text}
      </StyledSwappableWord>
    ) : (
      <StyledWord $color={color} $isNoun={isNoun}>
        {text}
      </StyledWord>
    );

  const joinedBy = connectives(tokens);
  // AND / OR of a noun, coloured like the noun it joins clauses on
  const operatorWord = (nounTokenIndex: number) => (
    <StyledOperatorWord
      $color={colorOfNoun(nounTokenIndex)}
      $isClickable={!!onToggleOperator}
      onMouseDown={(e) => {
        if (!onToggleOperator) return;
        e.preventDefault();
        onToggleOperator(nounTokenIndex);
      }}
    >
      {operatorOf(tokens, nounTokenIndex)}
    </StyledOperatorWord>
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
              {isOpen(openMenu, tokenIndex, "swap") && renderMenu?.({ tokenIndex, kind: "swap" })}
            </StyledPart>
          );
        }
        if (token.kind === "focus") {
          return (
            <StyledPart key={tokenIndex}>
              {operatorWord(token.tokenIndex)}
              <StyledWord $color={color}>
                {tokenText(tokens, tokenIndex).replace(/^\w+ /, "")}
              </StyledWord>
              {removeButton(tokenIndex)}
            </StyledPart>
          );
        }
        const clause = clauseById(token.clauseId);
        return (
          <StyledPart key={tokenIndex}>
            {joinedBy[tokenIndex] !== undefined && operatorWord(joinedBy[tokenIndex]!)}
            {swappable(tokenIndex, color, clause.phrase)}
            {clause.target.kind === "noun" && (
              <StyledWord $color={colorOfNoun(tokenIndex)} $isNoun>
                {tokenText(tokens, tokenIndex).slice(clause.phrase.length + 1)}
              </StyledWord>
            )}
            {removeButton(tokenIndex)}
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
            {token.entity && onOpenMenu && widenings(clause, token.entity, false).length > 0 && (
              // the spot a text cursor would take right after the entity
              <StyledCaretSlot
                $isOpen={isOpen(openMenu, tokenIndex, "widen")}
                data-swap-target
                onMouseDown={(e) => {
                  e.preventDefault();
                  onOpenMenu({ tokenIndex, kind: "widen" });
                }}
              >
                {isOpen(openMenu, tokenIndex, "widen") &&
                  renderMenu?.({ tokenIndex, kind: "widen" })}
              </StyledCaretSlot>
            )}
            {isOpen(openMenu, tokenIndex, "swap") && renderMenu?.({ tokenIndex, kind: "swap" })}
          </StyledPart>
        );
      })}
    </>
  );
};
