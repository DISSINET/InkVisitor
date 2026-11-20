// PROTOTYPE: sentence query builder, a throwaway for the team meeting.
//
// Question: can a user who does not know the graph builder build a query by
// writing a sentence? Two variants, switched with the floating bar at the
// bottom of the page (or ← →):
//   A  Type a sentence: word by word, suggestions show only what fits next
//   B  Pick a sentence: ready-made sentences with blanks to fill in
// Both compile to the same Query.INode tree and load it into the graph builder
// below, so the result and the graph can be checked side by side.
//
// The variant is kept in localStorage: the page's own url handling rewrites the
// location on every detail change and would drop a ?variant= param.
import { Query } from "@inkvisitor/shared/types";
import { Button } from "components";
import { isAnyLayerOpen } from "components/basic/Modal/layerStack";
import React, { useEffect, useState } from "react";

import { QueryAction, QueryActionType } from "../Query/state";
import { compileSentence, Token } from "./sentenceGrammar";
import { SentenceTemplates, TEMPLATES } from "./SentenceTemplates";
import { SentenceTyped } from "./SentenceTyped";
import {
  StyledActions,
  StyledPrototype,
  StyledPrototypeBadge,
  StyledPrototypeHeader,
  StyledSwitcher,
  StyledSwitcherArrow,
} from "./SentenceQueryPrototypeStyles";

const VARIANTS = [
  { key: "A", name: "Type a sentence" },
  { key: "B", name: "Pick a sentence" },
];
const variantStorageKey = "sentenceQueryPrototypeVariant";

const readVariant = () => {
  try {
    const stored = Number(localStorage.getItem(variantStorageKey));
    return stored >= 0 && stored < VARIANTS.length ? stored : 0;
  } catch {
    return 0;
  }
};

const edgeLines = (node: Query.INode, depth = 0): string[] =>
  node.edges.flatMap((edge) => {
    const target = edge.node.params.entityId
      ? "[picked entity]"
      : `class ${edge.node.params.entityClasses?.join(", ") || "any"}`;
    const not = edge.logic === Query.EdgeLogic.Negative ? "NOT " : "";
    return [
      `${"   ".repeat(depth)}${not}${edge.type}  ${Query.EdgeTypeLabels[edge.type]}  →  ${target}`,
      ...edgeLines(edge.node, depth + 1),
    ];
  });

interface SentenceQueryPrototype {
  dispatch: (action: QueryAction) => void;
  onRunSearch: () => void;
}
export const SentenceQueryPrototype: React.FC<SentenceQueryPrototype> = ({
  dispatch,
  onRunSearch,
}) => {
  const [variant, setVariant] = useState(readVariant);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [templateIndex, setTemplateIndex] = useState<number | undefined>(undefined);
  const [showEdges, setShowEdges] = useState(false);

  const switchVariant = (step: number) => {
    const next = (variant + step + VARIANTS.length) % VARIANTS.length;
    setVariant(next);
    setTokens([]);
    setTemplateIndex(undefined);
    try {
      localStorage.setItem(variantStorageKey, String(next));
    } catch {
      // the variant just isn't remembered
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (isAnyLayerOpen()) return;
      const focused = document.activeElement as HTMLElement | null;
      const tag = focused?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || focused?.isContentEditable) return;
      switchVariant(e.key === "ArrowLeft" ? -1 : 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  const changeTokens = (next: Token[]) => {
    setTokens(next);
    const compiled = compileSentence(next);
    if (compiled) {
      dispatch({ type: QueryActionType.setQueryState, payload: { newState: compiled } });
    }
  };

  const compiled = compileSentence(tokens);

  return (
    <>
      <StyledPrototype>
        <StyledPrototypeHeader>
          <StyledPrototypeBadge>PROTOTYPE</StyledPrototypeBadge>
          {VARIANTS[variant].key} · {VARIANTS[variant].name}. The graph below follows the sentence.
        </StyledPrototypeHeader>

        {variant === 0 && <SentenceTyped tokens={tokens} onChange={changeTokens} />}
        {variant === 1 && (
          <SentenceTemplates
            tokens={tokens}
            templateIndex={templateIndex}
            onPickTemplate={(index) => {
              setTemplateIndex(index);
              changeTokens(TEMPLATES[index]);
            }}
            onChange={changeTokens}
          />
        )}

        <StyledActions>
          <Button label="run search" disabled={!compiled} onClick={onRunSearch} />
          <Button
            label="clear"
            color="greyer"
            inverted
            disabled={!tokens.length}
            onClick={() => {
              setTokens([]);
              setTemplateIndex(undefined);
            }}
          />
          <Button
            label={showEdges ? "hide edges" : "show edges"}
            color="greyer"
            inverted
            disabled={!compiled}
            onClick={() => setShowEdges(!showEdges)}
          />
        </StyledActions>
        {showEdges && compiled && (
          <pre>
            {[
              `root  class ${compiled.params.entityClasses?.join(", ") || "any"}`,
              ...edgeLines(compiled, 1),
            ].join("\n")}
          </pre>
        )}
      </StyledPrototype>

      <StyledSwitcher>
        <StyledSwitcherArrow onClick={() => switchVariant(-1)}>←</StyledSwitcherArrow>
        <span>
          {VARIANTS[variant].key} ({VARIANTS[variant].name})
        </span>
        <StyledSwitcherArrow onClick={() => switchVariant(1)}>→</StyledSwitcherArrow>
      </StyledSwitcher>
    </>
  );
};
