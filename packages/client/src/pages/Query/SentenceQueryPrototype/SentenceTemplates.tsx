// PROTOTYPE: variant B, the user picks a ready-made sentence and fills in its
// blanks. No grammar to learn, and more can still be typed at the end.
import React from "react";

import { blankLabel, clauseById, Token, tokenText } from "./sentenceGrammar";
import { SentenceTyped } from "./SentenceTyped";
import {
  StyledBlank,
  StyledHelpLine,
  StyledTemplate,
  StyledTemplateList,
} from "./SentenceQueryPrototypeStyles";

const clause = (clauseId: string): Token => ({ kind: "clause", clauseId });

export const TEMPLATES: Token[][] = [
  [{ kind: "root", noun: "statements" }, clause("s-under"), clause("s-subject")],
  [{ kind: "root", noun: "statements" }, clause("s-action"), clause("s-subject")],
  [{ kind: "root", noun: "statements" }, clause("s-mentions"), clause("s-not-mentions")],
  [{ kind: "root", noun: "persons" }, clause("e-subject-of"), clause("s-under")],
  [
    { kind: "root", noun: "persons" },
    clause("e-subject-of"),
    clause("s-action"),
    { kind: "focus", tokenIndex: 0 },
    clause("p-type"),
  ],
  [{ kind: "root", noun: "entities" }, clause("e-used-under")],
  [{ kind: "root", noun: "entities" }, clause("p-type"), clause("p-value")],
];

const templateText = (template: Token[]) =>
  template.map((token, tokenIndex) => {
    const text = tokenText(template, tokenIndex);
    if (token.kind !== "clause") return <React.Fragment key={tokenIndex}>{text} </React.Fragment>;
    const blank = clauseById(token.clauseId).target.kind === "entity";
    return (
      <React.Fragment key={tokenIndex}>
        {text} {blank && <StyledBlank>[{blankLabel(clauseById(token.clauseId))}] </StyledBlank>}
      </React.Fragment>
    );
  });

interface SentenceTemplates {
  tokens: Token[];
  templateIndex: number | undefined;
  onPickTemplate: (templateIndex: number) => void;
  onChange: (tokens: Token[]) => void;
}
export const SentenceTemplates: React.FC<SentenceTemplates> = ({
  tokens,
  templateIndex,
  onPickTemplate,
  onChange,
}) => (
  <>
    <StyledTemplateList>
      {TEMPLATES.map((template, index) => (
        <StyledTemplate
          key={index}
          $active={index === templateIndex}
          onClick={() => onPickTemplate(index)}
        >
          {templateText(template)}
        </StyledTemplate>
      ))}
    </StyledTemplateList>
    {templateIndex !== undefined && (
      <>
        <StyledHelpLine>
          Fill in the blanks. More conditions can be added at the end.
        </StyledHelpLine>
        <SentenceTyped tokens={tokens} onChange={onChange} sentenceKey={templateIndex} />
      </>
    )}
  </>
);
