// PROTOTYPE: variant A, the user types the sentence word by word and picks
// each next phrase from the suggestions that fit at that point.
import { IEntity } from "@inkvisitor/shared/types";
import { EntitySuggester } from "components/advanced";
import React, { useMemo, useRef, useState } from "react";
import { getEntityLabel } from "utils/utils";

import { nextSuggestions, pendingEntityClause, Suggestion, Token } from "./sentenceGrammar";
import { SentenceWords } from "./SentenceWords";
import {
  StyledHelpLine,
  StyledSentence,
  StyledSentenceInput,
  StyledSuggestion,
  StyledSuggestionHint,
  StyledSuggestionList,
} from "./SentenceQueryPrototypeStyles";

// every typed word has to start a word of the suggestion, in any order, so
// "subj pers" finds "persons ... that are the subject of"
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
}
export const SentenceTyped: React.FC<SentenceTyped> = ({ tokens, onChange }) => {
  const [typed, setTyped] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pending = pendingEntityClause(tokens);
  const suggestions = useMemo(
    () => nextSuggestions(tokens).filter((suggestion) => matches(suggestion, typed)),
    [tokens, typed]
  );

  const pick = (suggestion: Suggestion) => {
    onChange([...tokens, suggestion.token]);
    setTyped("");
    setActiveIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const pickEntity = (entity: IEntity) => {
    const last = tokens[tokens.length - 1];
    if (last?.kind !== "clause") return;
    onChange([
      ...tokens.slice(0, -1),
      { ...last, entity: { id: entity.id, label: getEntityLabel(entity), class: entity.class } },
    ]);
    setIsOpen(true);
    // the input mounts again once the slot is filled
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeLast = () => {
    const last = tokens[tokens.length - 1];
    if (!last) return;
    if (last.kind === "clause" && last.entity) {
      onChange([...tokens.slice(0, -1), { kind: "clause", clauseId: last.clauseId }]);
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
      <StyledSentence onClick={() => inputRef.current?.focus()}>
        <SentenceWords
          tokens={tokens}
          renderPendingSlot={() => (
            <EntitySuggester
              key={tokens.length}
              inputWidth={180}
              suggestionListWidth={320}
              categoryTypes={pending?.target.kind === "entity" ? pending.target.classes : []}
              initCategory={
                pending?.target.kind === "entity" ? pending.target.initClass : undefined
              }
              placeholder="type a name"
              disableCreate
              disableTemplatesAccept
              autoFocus
              autoFocusInput
              onPicked={pickEntity}
            />
          )}
        />
        {!pending && (
          <StyledSentenceInput
            ref={inputRef}
            value={typed}
            placeholder={tokens.length ? "keep typing" : "what are you looking for? e.g. persons"}
            onChange={(e) => {
              setTyped(e.target.value);
              setActiveIndex(0);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            onKeyDown={onKeyDown}
          />
        )}
        {!pending && isOpen && suggestions.length > 0 && (
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
                <span>{suggestion.text}</span>
                {suggestion.hint && <StyledSuggestionHint>{suggestion.hint}</StyledSuggestionHint>}
              </StyledSuggestion>
            ))}
          </StyledSuggestionList>
        )}
      </StyledSentence>
      <StyledHelpLine>
        Type to filter, ↑ ↓ to move, Enter or Tab to add, Backspace to remove the last part.
      </StyledHelpLine>
    </>
  );
};
