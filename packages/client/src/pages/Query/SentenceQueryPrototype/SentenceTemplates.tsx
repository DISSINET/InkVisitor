// PROTOTYPE: variant B, the user picks a ready-made sentence and fills in its
// blanks. No grammar to learn, but only the shapes someone wrote down.
import { IEntity } from "@inkvisitor/shared/types";
import { EntitySuggester } from "components/advanced";
import React from "react";
import { getEntityLabel } from "utils/utils";

import { blankLabel, clauseById, Token, tokenText } from "./sentenceGrammar";
import { SentenceWords } from "./SentenceWords";
import {
  StyledBlank,
  StyledFillRow,
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
}) => {
  const fillSlot = (tokenIndex: number, entity: IEntity) => {
    const token = tokens[tokenIndex];
    if (token.kind !== "clause") return;
    const next = [...tokens];
    next[tokenIndex] = {
      ...token,
      entity: { id: entity.id, label: getEntityLabel(entity), class: entity.class },
    };
    onChange(next);
  };

  return (
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
          <StyledHelpLine>Fill in the blanks:</StyledHelpLine>
          <StyledFillRow>
            <SentenceWords
              tokens={tokens}
              onClearEntity={(tokenIndex) => {
                const token = tokens[tokenIndex];
                if (token.kind !== "clause") return;
                const next = [...tokens];
                next[tokenIndex] = { kind: "clause", clauseId: token.clauseId };
                onChange(next);
              }}
              renderPendingSlot={(tokenIndex) => {
                const token = tokens[tokenIndex];
                if (token.kind !== "clause") return null;
                const target = clauseById(token.clauseId).target;
                if (target.kind !== "entity") return null;
                return (
                  <EntitySuggester
                    key={`${templateIndex}-${tokenIndex}`}
                    inputWidth={160}
                    suggestionListWidth={320}
                    categoryTypes={target.classes}
                    initCategory={target.initClass}
                    placeholder={blankLabel(clauseById(token.clauseId))}
                    disableCreate
                    disableTemplatesAccept
                    onPicked={(entity) => fillSlot(tokenIndex, entity)}
                  />
                );
              }}
            />
          </StyledFillRow>
        </>
      )}
    </>
  );
};
