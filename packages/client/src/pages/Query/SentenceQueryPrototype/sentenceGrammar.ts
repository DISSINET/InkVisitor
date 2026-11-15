// PROTOTYPE: throwaway code for the sentence query builder demo, not production.
//
// A sentence is a list of tokens. It starts with a root noun ("statements",
// "persons", ...), then clauses follow. Each clause attaches to the noun in
// focus: the latest noun the sentence introduced, unless a "focus" token moved
// it back to an earlier one. A clause either pins an entity ("with subject
// [Jan]") or introduces a new noun ("that are the subject of statements"),
// which becomes a new node of the query and takes the focus.
//
// The sentence compiles to the same Query.INode tree the graph builder edits.

import { EntityEnums } from "@inkvisitor/shared/enums";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { IEntity, Query } from "@inkvisitor/shared/types";

import { edgeTypesWithoutSubordinates, edgeTypesWithSubtreeDepth } from "../types";

export type NounKey =
  | "statements"
  | "persons"
  | "groups"
  | "locations"
  | "objects"
  | "concepts"
  | "entities";

export interface Noun {
  key: NounKey;
  label: string;
  // empty means any class
  classes: EntityEnums.Class[];
}

export const NOUNS: Record<NounKey, Noun> = {
  statements: { key: "statements", label: "statements", classes: [EntityEnums.Class.Statement] },
  persons: { key: "persons", label: "persons", classes: [EntityEnums.Class.Person] },
  groups: { key: "groups", label: "groups", classes: [EntityEnums.Class.Group] },
  locations: { key: "locations", label: "locations", classes: [EntityEnums.Class.Location] },
  objects: { key: "objects", label: "objects", classes: [EntityEnums.Class.Object] },
  concepts: { key: "concepts", label: "concepts", classes: [EntityEnums.Class.Concept] },
  entities: { key: "entities", label: "entities", classes: [] },
};

export const ROOT_NOUNS: NounKey[] = [
  "statements",
  "persons",
  "groups",
  "locations",
  "objects",
  "concepts",
  "entities",
];

export type ClauseTarget =
  // initClass is the class the entity picker opens with
  | { kind: "entity"; classes: EntityEnums.Class[]; initClass?: EntityEnums.Class }
  | { kind: "noun"; noun: NounKey };

export interface Clause {
  id: string;
  phrase: string;
  edgeType: Query.EdgeType;
  logic: Query.EdgeLogic;
  // which nouns the phrase reads well after; the edge's own source rule is
  // checked on top of this
  on: "statements" | "nonStatements" | "any";
  target: ClauseTarget;
}

const anyEntity: ClauseTarget = {
  kind: "entity",
  classes: classesAll,
  initClass: EntityEnums.Class.Person,
};

export const CLAUSES: Clause[] = [
  // statements
  {
    id: "s-subject",
    phrase: "with subject",
    edgeType: Query.EdgeType["I_IS:S"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-action",
    phrase: "with action",
    edgeType: Query.EdgeType["I_IS:A"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: { kind: "entity", classes: [EntityEnums.Class.Action] },
  },
  {
    id: "s-actant1",
    phrase: "with actant1",
    edgeType: Query.EdgeType["I_IS:A1"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-mentions",
    phrase: "mentioning",
    edgeType: Query.EdgeType["I_IS:"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-not-mentions",
    phrase: "not mentioning",
    edgeType: Query.EdgeType["I_IS:"],
    logic: Query.EdgeLogic.Negative,
    on: "statements",
    target: anyEntity,
  },
  {
    id: "s-under",
    phrase: "under territory",
    edgeType: Query.EdgeType["SUT:"],
    logic: Query.EdgeLogic.Positive,
    on: "statements",
    target: { kind: "entity", classes: [EntityEnums.Class.Territory] },
  },
  // other entities, linking to statements
  {
    id: "e-subject-of",
    phrase: "that are the subject of",
    edgeType: Query.EdgeType["IS:S"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "noun", noun: "statements" },
  },
  {
    id: "e-appear-in",
    phrase: "that appear in",
    edgeType: Query.EdgeType["IS:"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "noun", noun: "statements" },
  },
  {
    id: "e-used-under",
    phrase: "used in statements under territory",
    edgeType: Query.EdgeType["EUT:"],
    logic: Query.EdgeLogic.Positive,
    on: "nonStatements",
    target: { kind: "entity", classes: [EntityEnums.Class.Territory] },
  },
  // props, on anything
  {
    id: "p-type",
    phrase: "with a property of type",
    edgeType: Query.EdgeType["EP:T"],
    logic: Query.EdgeLogic.Positive,
    on: "any",
    target: { kind: "entity", classes: [EntityEnums.Class.Concept] },
  },
  {
    id: "p-value",
    phrase: "with a property value",
    edgeType: Query.EdgeType["HP:V"],
    logic: Query.EdgeLogic.Positive,
    on: "any",
    target: anyEntity,
  },
];

export const clauseById = (id: string): Clause => CLAUSES.find((clause) => clause.id === id)!;

export interface PickedEntity {
  id: string;
  label: string;
  class: EntityEnums.Class;
  // the whole entity, for its tag
  entity: IEntity;
  // EQ / SUB of the graph builder's node: widen the picked entity to its
  // equivalents and to what is under it
  includeEquivalents?: boolean;
  includeSubordinates?: boolean;
}

export type Widening = "equivalents" | "subordinates";

export const subordinatesApply = (clause: Clause) =>
  !edgeTypesWithoutSubordinates.includes(clause.edgeType);

// worded after the EQ / SUB toggles of the graph node, so the two read alike
export const wideningPhrase = (clause: Clause, widening: Widening): string => {
  if (widening === "equivalents") return "+ equivalents";
  // I_CT: reads SUB as how deep below the territory to match
  return edgeTypesWithSubtreeDepth.includes(clause.edgeType)
    ? "+ all levels below"
    : "+ subordinates";
};

export type Token =
  | { kind: "root"; noun: NounKey }
  | { kind: "clause"; clauseId: string; entity?: PickedEntity }
  // moves the focus back to the noun introduced by the token at `tokenIndex`
  | { kind: "focus"; tokenIndex: number };

/** The nouns a sentence has introduced, by the index of the token that did. */
export const introducedNouns = (tokens: Token[]): { tokenIndex: number; noun: NounKey }[] => {
  const nouns: { tokenIndex: number; noun: NounKey }[] = [];
  tokens.forEach((token, tokenIndex) => {
    if (token.kind === "root") {
      nouns.push({ tokenIndex, noun: token.noun });
    } else if (token.kind === "clause") {
      const target = clauseById(token.clauseId).target;
      if (target.kind === "noun") {
        nouns.push({ tokenIndex, noun: target.noun });
      }
    }
  });
  return nouns;
};

/**
 * For each token, the index of the token whose noun it attaches to, and the
 * noun in focus once the whole sentence is read.
 */
const walkFocus = (tokens: Token[]): { attachedTo: number[]; focus: number } => {
  let focus = 0;
  const attachedTo = tokens.map((token, tokenIndex) => {
    if (token.kind === "root") {
      focus = tokenIndex;
      return tokenIndex;
    }
    if (token.kind === "focus") {
      focus = token.tokenIndex;
      return token.tokenIndex;
    }
    const attached = focus;
    if (clauseById(token.clauseId).target.kind === "noun") {
      focus = tokenIndex;
    }
    return attached;
  });
  return { attachedTo, focus };
};

export const attachments = (tokens: Token[]): number[] => walkFocus(tokens).attachedTo;

export const nounOfToken = (tokens: Token[], tokenIndex: number): NounKey | undefined =>
  introducedNouns(tokens).find((noun) => noun.tokenIndex === tokenIndex)?.noun;

/** The index of the token that introduced the noun in focus. */
export const focusTokenIndex = (tokens: Token[]): number => walkFocus(tokens).focus;

export const focusedNoun = (tokens: Token[]): NounKey | undefined =>
  tokens.length ? nounOfToken(tokens, focusTokenIndex(tokens)) : undefined;

const sourceRuleAllows = (edgeType: Query.EdgeType, noun: Noun): boolean => {
  const sourceClasses = Query.EdgeTypeNodeRules[edgeType][0].params.entityClass ?? [];
  if (!sourceClasses.length) return true;
  return noun.classes.length > 0 && noun.classes.every((cls) => sourceClasses.includes(cls));
};

export const clausesFor = (nounKey: NounKey): Clause[] => {
  const noun = NOUNS[nounKey];
  const isStatement = nounKey === "statements";
  return CLAUSES.filter((clause) => {
    if (clause.on === "statements" && !isStatement) return false;
    if (clause.on === "nonStatements" && isStatement) return false;
    return sourceRuleAllows(clause.edgeType, noun);
  });
};

export type SuggestionAction =
  | { kind: "add"; token: Token }
  // widens the entity picked by the last clause
  | { kind: "widen"; widening: Widening };

export interface Suggestion {
  text: string;
  hint?: string;
  action: SuggestionAction;
}

/** What the sentence can continue with, unless a clause waits for its entity. */
export const nextSuggestions = (tokens: Token[]): Suggestion[] => {
  if (!tokens.length) {
    return ROOT_NOUNS.map((noun) => ({
      text: NOUNS[noun].label,
      hint: "start with",
      action: { kind: "add", token: { kind: "root", noun } },
    }));
  }
  const noun = focusedNoun(tokens);
  if (!noun) return [];
  const clauses: Suggestion[] = clausesFor(noun).map((clause) => ({
    text:
      clause.target.kind === "noun"
        ? `${clause.phrase} ${NOUNS[clause.target.noun].label}`
        : clause.phrase,
    hint: `about the ${NOUNS[noun].label}`,
    action: { kind: "add", token: { kind: "clause", clauseId: clause.id } },
  }));
  const focus = focusTokenIndex(tokens);
  const backReferences: Suggestion[] = introducedNouns(tokens)
    .filter((introduced) => introduced.tokenIndex !== focus)
    .map((introduced) => ({
      text: `and those ${NOUNS[introduced.noun].label}`,
      hint: "go back to",
      action: { kind: "add", token: { kind: "focus", tokenIndex: introduced.tokenIndex } },
    }));

  // right after a picked entity, its EQ / SUB come first
  const widenings: Suggestion[] = [];
  const last = tokens[tokens.length - 1];
  if (last.kind === "clause" && last.entity) {
    const clause = clauseById(last.clauseId);
    if (!last.entity.includeEquivalents) {
      widenings.push({
        text: wideningPhrase(clause, "equivalents"),
        hint: `of ${last.entity.label}`,
        action: { kind: "widen", widening: "equivalents" },
      });
    }
    if (subordinatesApply(clause) && !last.entity.includeSubordinates) {
      widenings.push({
        text: wideningPhrase(clause, "subordinates"),
        hint: `of ${last.entity.label}`,
        action: { kind: "widen", widening: "subordinates" },
      });
    }
  }

  return [...widenings, ...clauses, ...backReferences];
};

/** The clause at the end of the sentence that still waits for its entity. */
export const pendingEntityClause = (tokens: Token[]): Clause | undefined => {
  const last = tokens[tokens.length - 1];
  if (last?.kind !== "clause" || last.entity) return undefined;
  const clause = clauseById(last.clauseId);
  return clause.target.kind === "entity" ? clause : undefined;
};

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

const newNode = (params: Query.INodeParams, id?: string): Query.INode => ({
  id: id ?? nextId("sentence-node"),
  type: Query.NodeType.E,
  params,
  operator: Query.NodeOperator.And,
  edges: [],
});

/**
 * Compiles the sentence to a query tree. A clause still waiting for its entity
 * is left out, so a half-typed sentence still compiles to what it says so far.
 */
export const compileSentence = (tokens: Token[]): Query.INode | undefined => {
  const root = tokens[0];
  if (root?.kind !== "root") return undefined;

  const nodesByToken = new Map<number, Query.INode>();
  nodesByToken.set(0, newNode({ entityClasses: NOUNS[root.noun].classes }, "root"));
  const attachedTo = attachments(tokens);

  tokens.forEach((token, tokenIndex) => {
    if (token.kind !== "clause") return;
    const clause = clauseById(token.clauseId);
    const source = nodesByToken.get(attachedTo[tokenIndex]);
    if (!source) return;

    let target: Query.INode;
    if (clause.target.kind === "noun") {
      target = newNode({ entityClasses: NOUNS[clause.target.noun].classes });
      nodesByToken.set(tokenIndex, target);
    } else if (token.entity) {
      // a pinned entity is the whole match of its node, as the graph builder
      // stores it
      target = newNode({
        entityId: token.entity.id,
        entityClasses: [],
        includeEquivalents: token.entity.includeEquivalents || undefined,
        includeSubordinates:
          (subordinatesApply(clause) && token.entity.includeSubordinates) || undefined,
      });
    } else {
      return;
    }

    source.edges.push({
      id: nextId("sentence-edge"),
      type: clause.edgeType,
      params: {},
      logic: clause.logic,
      node: target,
    });
  });

  return nodesByToken.get(0);
};

/** Plain text of a token, as the sentence shows it. */
export const tokenText = (tokens: Token[], tokenIndex: number): string => {
  const token = tokens[tokenIndex];
  if (token.kind === "root") return NOUNS[token.noun].label;
  if (token.kind === "focus") {
    const noun = nounOfToken(tokens, token.tokenIndex);
    return `and those ${noun ? NOUNS[noun].label : ""}`;
  }
  const clause = clauseById(token.clauseId);
  if (clause.target.kind === "noun") {
    return `${clause.phrase} ${NOUNS[clause.target.noun].label}`;
  }
  return clause.phrase;
};

const classNames: Partial<Record<EntityEnums.Class, string>> = {
  [EntityEnums.Class.Action]: "action",
  [EntityEnums.Class.Territory]: "territory",
  [EntityEnums.Class.Concept]: "concept",
  [EntityEnums.Class.Person]: "person",
};

/** The placeholder of an entity slot: its class when it allows only one. */
export const blankLabel = (clause: Clause): string => {
  if (clause.target.kind !== "entity") return "";
  const classes = clause.target.classes;
  return classes.length === 1 ? (classNames[classes[0]] ?? "entity") : "entity";
};
