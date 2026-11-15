// PROTOTYPE: the sentence the user types word by word, picking each next
// phrase from the suggestions that fit at that point. Variant A starts it
// empty, variant B from a ready-made sentence whose blanks it fills in.
import { IEntity, Query } from "@inkvisitor/shared/types";
import { EntitySuggester } from "components/advanced";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getEntityLabel } from "utils/utils";

import {
  blankLabel,
  clauseById,
  focusTokenIndex,
  nextSuggestions,
  operatorOf,
  pendingEntityClause,
  removeToken,
  Suggestion,
  swapSuggestions,
  swapToken,
  Token,
  Widening,
  wideningSuggestions,
  withOperator,
} from "./sentenceGrammar";
import { PartMenu, SentenceWords } from "./SentenceWords";
import {
  StyledHelpLine,
  StyledInputPart,
  StyledSentence,
  StyledSentenceInput,
  StyledSuggestion,
  StyledSuggestionHint,
  StyledSuggestionList,
} from "./SentenceQueryPrototypeStyles";

// every typed word has to start a word of the suggestion, in any order, so
// "subj pers" finds "persons ... that are the subject of"
// a leading "and" / "or" sets how the picked clause joins the others on its noun
const splitConnective = (typed: string): { connective?: Query.NodeOperator; rest: string } => {
  const match = typed.match(/^\s*(and|or)(?:\s+|$)(.*)$/i);
  if (!match) return { rest: typed };
  const connective =
    match[1].toLowerCase() === "or" ? Query.NodeOperator.Or : Query.NodeOperator.And;
  return { connective, rest: match[2] };
};

// the suggestion as it reads with the typed connective in front
const withConnective = (suggestion: Suggestion, connective?: Query.NodeOperator) => {
  const { action } = suggestion;
  if (!connective || action.kind !== "add") return suggestion.text;
  if (action.token.kind === "focus") return suggestion.text.replace(/^\w+/, connective);
  return `${connective} ${suggestion.text}`;
};

const matches = (suggestion: Suggestion, typed: string) => {
  const words = suggestion.text.toLowerCase().split(/\s+/);
  return typed
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((typedWord) => words.some((word) => word.startsWith(typedWord)));
};

interface SentenceTyped {
  tokens: Token[];
  onChange: (tokens: Token[]) => void;
  // remounts the blanks' pickers when the sentence is replaced as a whole
  sentenceKey?: string | number;
}
export const SentenceTyped: React.FC<SentenceTyped> = ({ tokens, onChange, sentenceKey }) => {
  const [typed, setTyped] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // the menu open on a part of the sentence
  const [openMenu, setOpenMenu] = useState<PartMenu>();

  useEffect(() => {
    if (!openMenu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.("[data-swap-target]")) setOpenMenu(undefined);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpenMenu(undefined);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [openMenu]);

  const pending = pendingEntityClause(tokens);
  const { connective, rest } = splitConnective(typed);
  const suggestions = useMemo(
    () =>
      nextSuggestions(tokens).filter(
        (suggestion) =>
          matches(suggestion, rest) &&
          // a connective joins a clause, it says nothing before EQ / SUB or the first noun
          (!connective ||
            (suggestion.action.kind === "add" && suggestion.action.token.kind !== "root"))
      ),
    [tokens, rest, connective]
  );

  const replaceToken = (tokenIndex: number, token: Token) => {
    const next = [...tokens];
    next[tokenIndex] = token;
    onChange(next);
  };

  const fillSlot = (tokenIndex: number, entity: IEntity) => {
    const token = tokens[tokenIndex];
    if (token.kind !== "clause") return;
    replaceToken(tokenIndex, {
      ...token,
      entity: { id: entity.id, label: getEntityLabel(entity), class: entity.class, entity },
    });
    setIsOpen(true);
    // the input mounts again once the last slot is filled
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const clearSlot = (tokenIndex: number) => {
    const token = tokens[tokenIndex];
    if (token.kind !== "clause") return;
    replaceToken(tokenIndex, { kind: "clause", clauseId: token.clauseId });
  };

  const widen = (tokenIndex: number, widening: Widening, value: boolean) => {
    const token = tokens[tokenIndex];
    if (token.kind !== "clause" || !token.entity) return;
    const field = widening === "equivalents" ? "includeEquivalents" : "includeSubordinates";
    replaceToken(tokenIndex, { ...token, entity: { ...token.entity, [field]: value } });
  };

  const pick = (suggestion: Suggestion) => {
    const { action } = suggestion;
    if (action.kind === "add") {
      const { token } = action;
      const noun = token.kind === "focus" ? token.tokenIndex : focusTokenIndex(tokens);
      const joined = connective ? withOperator(tokens, noun, connective) : tokens;
      onChange([...joined, token]);
    }
    if (action.kind === "widen") widen(tokens.length - 1, action.widening, true);
    setTyped("");
    setActiveIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const removeLast = () => {
    const last = tokens[tokens.length - 1];
    if (!last) return;
    if (last.kind === "clause" && last.entity) {
      clearSlot(tokens.length - 1);
    } else {
      onChange(tokens.slice(0, -1));
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if ((e.key === "Enter" || e.key === "Tab") && isOpen && suggestions[activeIndex]) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Backspace" && typed === "") {
      removeLast();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* a click on a blank's picker or a toggle stays there */}
      <StyledSentence onClick={(e) => e.target === e.currentTarget && inputRef.current?.focus()}>
        <SentenceWords
          tokens={tokens}
          onClearEntity={clearSlot}
          onWiden={widen}
          openMenu={openMenu}
          onToggleOperator={(nounTokenIndex) =>
            onChange(
              withOperator(
                tokens,
                nounTokenIndex,
                operatorOf(tokens, nounTokenIndex) === Query.NodeOperator.And
                  ? Query.NodeOperator.Or
                  : Query.NodeOperator.And
              )
            )
          }
          onOpenMenu={(menu) => {
            setIsOpen(false);
            setOpenMenu((open) =>
              open?.tokenIndex === menu.tokenIndex && open.kind === menu.kind ? undefined : menu
            );
          }}
          onRemove={(tokenIndex) => {
            setOpenMenu(undefined);
            onChange(removeToken(tokens, tokenIndex));
          }}
          renderMenu={({ tokenIndex, kind }) => (
            <StyledSuggestionList data-swap-target>
              {(kind === "widen"
                ? wideningSuggestions(tokens[tokenIndex])
                : swapSuggestions(tokens, tokenIndex)
              ).map((suggestion) => (
                <StyledSuggestion
                  key={suggestion.text}
                  $active={suggestion.hint === "current"}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // the widen menu sits inside the slot that opens it
                    e.stopPropagation();
                    setOpenMenu(undefined);
                    const { action } = suggestion;
                    if (action.kind === "widen") widen(tokenIndex, action.widening, true);
                    if (action.kind === "add")
                      onChange(swapToken(tokens, tokenIndex, action.token));
                  }}
                >
                  <span>{suggestion.text}</span>
                  {suggestion.hint && (
                    <StyledSuggestionHint>{suggestion.hint}</StyledSuggestionHint>
                  )}
                </StyledSuggestion>
              ))}
            </StyledSuggestionList>
          )}
          renderPendingSlot={(tokenIndex) => {
            const token = tokens[tokenIndex];
            if (token.kind !== "clause") return null;
            const clause = clauseById(token.clauseId);
            if (clause.target.kind !== "entity") return null;
            const isLast = tokenIndex === tokens.length - 1;
            return (
              <EntitySuggester
                key={`${sentenceKey}-${tokenIndex}`}
                inputWidth={160}
                suggestionListWidth={320}
                categoryTypes={clause.target.classes}
                initCategory={clause.target.initClass}
                placeholder={blankLabel(clause)}
                disableCreate
                disableTemplatesAccept
                autoFocus={isLast}
                autoFocusInput={isLast}
                onPicked={(entity) => fillSlot(tokenIndex, entity)}
              />
            );
          }}
        />
        {!pending && (
          // the list opens under the input, where the sentence continues
          <StyledInputPart>
            <StyledSentenceInput
              ref={inputRef}
              value={typed}
              placeholder={
                tokens.length ? "add a condition" : "start with statements, persons, concepts"
              }
              onChange={(e) => {
                setTyped(e.target.value);
                setActiveIndex(0);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              onKeyDown={onKeyDown}
            />
            {isOpen && suggestions.length > 0 && (
              <StyledSuggestionList>
                {suggestions.map((suggestion, index) => (
                  <StyledSuggestion
                    key={suggestion.text}
                    $active={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    // mousedown keeps the input focused, so the list stays open
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(suggestion);
                    }}
                  >
                    <span>{withConnective(suggestion, connective)}</span>
                    {suggestion.hint && (
                      <StyledSuggestionHint>{suggestion.hint}</StyledSuggestionHint>
                    )}
                  </StyledSuggestion>
                ))}
              </StyledSuggestionList>
            )}
          </StyledInputPart>
        )}
      </StyledSentence>
      <StyledHelpLine>
        Type to filter, ↑ ↓ to move, Enter or Tab to add, Backspace to remove the last part. Click a
        part to swap it, × to remove it, AND / OR to switch it; or type "or" before a condition.
      </StyledHelpLine>
    </>
  );
};
